import { Express, Response, Request, NextFunction } from 'express';
import { getCurrentEnvironment, fetchWithTokenRefresh, extractErrorCode } from 'base-graphql';
import { Environment } from 'base-graphql';
import { Collection } from '../generated-types/type-defs';
import {
  createProxyMiddleware,
  responseInterceptor,
} from 'http-proxy-middleware';
import nodeFetch from 'node-fetch';

function extractIdFromMediafilePath(path: string): string | null {
  const regex = /\/api\/mediafile\/([a-f\d-]+)-[^\/]+$/;
  const match = path.match(regex);

  return match ? match[1] : null;
}

export const addHeaders = (proxyReq: any, req: Request, res: Response) => {
  const env: Environment = getCurrentEnvironment();
  const mediafileId = extractIdFromMediafilePath(req.originalUrl);
  if (mediafileId)
    res.setHeader(
      'Link',
      `${env?.api.collectionApiUrl}${Collection.Entities}/${mediafileId} ; rel="describedby" type="application/json"`
    );
};

const pump = (reader: any, res: any) => {
  reader
    .read()
    .then(({ done, value }: { done: any; value: any }) => {
      if (done) {
        reader.releaseLock();
        res.end();
        return;
      }
      res.write(value);
      pump(reader, res);
    })
    .catch((error: any) => {
      console.error('Error:', error);
      res.status(500).end(JSON.stringify({ error: 'Internal Server Error' }));
    });
};

const getDownloadUrlForMediafile = async (
  mediafileId: string,
  req: Request,
  environment: Environment,
  kind: 'transcode' | 'original' = 'transcode'
): Promise<string> => {
  try {
    const downloadUrls = await fetchWithTokenRefresh(
      `${environment.api.collectionApiUrl}/mediafiles/${mediafileId}/download-urls`,
      { method: 'GET' },
      req
    );
    const response: any = await downloadUrls.json();
    if (kind === 'transcode') return response['transcode_file_location'];
    else return response['original_file_location'];
  } catch (e) {
    console.error(e);
    return JSON.stringify(e);
  }
};

/**
 * The collection-api returns external (Traefik-facing) download URLs which use
 * *.localhost domains. These are unreachable from inside the container because
 * *.localhost always resolves to 127.0.0.1 (RFC 6761). This function maps known
 * external origins to their internal counterparts so the server-side fetch can
 * reach the actual service.
 */
const resolveExternalDownloadUrlToInternalUrl = (
  downloadUrl: string,
  environment: Environment
): string => {
  const parsed = new URL(downloadUrl);
  if (!parsed.hostname.endsWith('.localhost')) return downloadUrl;
  if (parsed.origin === new URL(environment.api.iiifUrlFrontend).origin) {
    return new URL(environment.api.iiifUrl).origin + parsed.pathname + parsed.search;
  }
  return new URL(environment.api.storageApiUrl).origin + parsed.pathname + parsed.search;
};

const applyMediaFileEndpoint = (app: Express, environment: Environment) => {
  app.use(
    ['/api/mediafile/*', '/api/mediafile/download-with-ticket'],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const urlWithoutParams = req.originalUrl.split('?')[0].split('/').filter(Boolean);
        const filename = urlWithoutParams.at(-1);
        if (!filename) throw new Error('Invalid URL');

        const isOriginal = req.query.original === 'true';
        const originalFilename = req.query.originalFilename as string | undefined;
        const kind = isOriginal ? 'original' : 'transcode';

        const downloadUrl = await getDownloadUrlForMediafile(filename, req, environment, kind);
        if (!downloadUrl) throw new Error('Invalid URL returned from helper');

        const internalUrl = resolveExternalDownloadUrlToInternalUrl(downloadUrl, environment);
        const fileResponse = await nodeFetch(internalUrl);
        if (!fileResponse.ok) throw new Error(`Upstream error: ${fileResponse.status}`);

        const contentType = fileResponse.headers.get('content-type') || '';
        res.setHeader('Content-Type', contentType);

        const extension = contentType.split('/')[1] || '';
        if (originalFilename && extension) {
          res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}.${extension}"`);
        }

        fileResponse.body!.pipe(res);
      } catch (error) {
        next(error);
      }
    }
  );

  app.use(
    '/api/iiif*.json',
    createProxyMiddleware({
      target: environment.api.iiifUrl,
      changeOrigin: true,
      selfHandleResponse: true,
      pathRewrite: (path: string, req: Request) => {
        return `${req.originalUrl.replace('/api', '')}`;
      },
      onProxyReq: (proxyReq, req, res) => {
        addHeaders(proxyReq, req, res);
      },
      onProxyRes: responseInterceptor(
        async (responseBuffer, proxyRes, req, res) => {
          try {
            const response = JSON.parse(responseBuffer.toString('utf8'));

            const idUrl = new URL(response.id);

            const updatedPath = idUrl.pathname.replace(
              /^\/iiif\/(?:image\/iiif\/|((\d+)\/))/,
              (_match, p1) => `/api/iiif/${p1 || ''}`
            );

            response.id = `${idUrl.origin}${updatedPath}`;

            return JSON.stringify(response);
          } catch (err) {
            console.error('Failed to rewrite IIIF id:', err);
            return responseBuffer;
          }
        }
      ),

      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).send(err);
      },
    })
  );

  app.use('/api/iiif/*', async (req, res) => {
    const target = `${environment.api.iiifUrl}${req.originalUrl.replace('/api', '')}`;
    try {
      let response;
      try {
        response = await fetchWithTokenRefresh(target, { method: 'GET' }, req);
      } catch (authErr) {
        if (process.env.IIIF_ALLOW_STATIC_TOKEN_FALLBACK !== 'true') {
          throw authErr;
        }
        const staticToken = environment.staticToken;
        response = await fetch(target, {
          method: 'GET',
          headers: staticToken ? { Authorization: `Bearer ${staticToken}` } : {},
        });
      }

      if (!response.ok) {
        throw response;
      }

      const blob = await response.blob();
      res.setHeader('Content-Type', blob.type);
      // @ts-ignore
      const reader = blob.stream().getReader();

      pump(reader, res);
    } catch (error: any) {
      res
        .status(extractErrorCode(error))
        .set({
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
        })
        .end(JSON.stringify(error));
    }
  });
};

export default applyMediaFileEndpoint;
