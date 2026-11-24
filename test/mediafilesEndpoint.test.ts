import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodeFetch from 'node-fetch';
import applyMediaFileEndpoint, {
  resolveExternalDownloadUrlToInternalUrl,
} from '../endpoints/mediafilesEndpoint';

vi.mock('base-graphql', () => ({
  getCurrentEnvironment: vi.fn(),
  extractErrorCode: vi.fn(),
  fetchWithTokenRefresh: vi.fn(async () => ({
    json: async () => ({
      transcode_file_location: 'https://podiumnet-uat.elody.eu/storage/v1/download/video.mp4',
    }),
  })),
}));

vi.mock('node-fetch', () => ({ default: vi.fn() }));

vi.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: vi.fn(),
  responseInterceptor: vi.fn(),
}));

const environment: any = {
  api: {
    storageApiUrl: 'http://storage.ns.svc.cluster.local:8000',
    storageApiUrlExt: 'https://podiumnet-uat.elody.eu/storage/v1',
    iiifUrl: 'http://cantaloupe:8182',
    iiifUrlFrontend: 'https://podiumnet-uat.elody.eu/iiif',
  },
};

describe('resolveExternalDownloadUrlToInternalUrl', () => {
  it('maps the public storage url to the in-cluster service', () => {
    expect(
      resolveExternalDownloadUrlToInternalUrl(
        'https://podiumnet-uat.elody.eu/storage/v1/download-with-ticket/a.jpg?ticket_id=1',
        environment
      )
    ).toBe('http://storage.ns.svc.cluster.local:8000/download-with-ticket/a.jpg?ticket_id=1');
  });

  it('maps the public iiif url to the in-cluster image server', () => {
    expect(
      resolveExternalDownloadUrlToInternalUrl('https://podiumnet-uat.elody.eu/iiif/3/a.jpg/full/max/0/default.jpg', environment)
    ).toBe('http://cantaloupe:8182/3/a.jpg/full/max/0/default.jpg');
  });

  it('handles trailing slashes on the configured urls', () => {
    const localEnvironment: any = {
      api: {
        storageApiUrl: 'http://storage-api-elody:5000/',
        storageApiUrlExt: 'http://storage-api.elody.localhost:8000/',
        iiifUrl: 'http://cantaloupe:8182',
        iiifUrlFrontend: 'http://cantaloupe.elody.localhost:8000',
      },
    };
    expect(
      resolveExternalDownloadUrlToInternalUrl('http://storage-api.elody.localhost:8000/download/a.jpg', localEnvironment)
    ).toBe('http://storage-api-elody:5000/download/a.jpg');
  });

  it('leaves unrelated urls alone', () => {
    const presigned = 'https://s3.eu-west-par.io.cloud.ovh.net/bucket/a.jpg?X-Amz-Signature=x';
    expect(resolveExternalDownloadUrlToInternalUrl(presigned, environment)).toBe(presigned);
  });
});

describe('mediafile endpoint', () => {
  const getMediafileHandler = () => {
    const handlers: Record<string, any> = {};
    const app: any = {
      use: (path: any, handler: any) => {
        handlers[JSON.stringify(path)] = handler;
      },
    };
    applyMediaFileEndpoint(app, environment);
    return handlers[JSON.stringify(['/api/mediafile/*', '/api/mediafile/download-with-ticket'])];
  };

  const mockUpstream = (status: number, headers: Record<string, string>) => {
    const pipe = vi.fn();
    vi.mocked(nodeFetch).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
      body: { pipe },
    } as any);
    return pipe;
  };

  const mockResponse = () => {
    const res: any = { headers: {} as Record<string, string> };
    res.setHeader = vi.fn((name: string, value: string) => {
      res.headers[name.toLowerCase()] = value;
    });
    res.status = vi.fn(() => res);
    return res;
  };

  const request = (headers: Record<string, string> = {}): any => ({
    originalUrl: '/api/mediafile/abc123',
    query: {},
    headers,
  });

  beforeEach(() => {
    vi.mocked(nodeFetch).mockReset();
  });

  it('forwards the Range header and relays a partial response', async () => {
    const pipe = mockUpstream(206, {
      'content-type': 'video/mp4',
      'content-length': '1000',
      'content-range': 'bytes 500-1499/5000',
      'accept-ranges': 'bytes',
    });
    const res = mockResponse();
    const next = vi.fn();

    await getMediafileHandler()(request({ range: 'bytes=500-1499' }), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(nodeFetch).toHaveBeenCalledWith(
      'http://storage.ns.svc.cluster.local:8000/download/video.mp4',
      { headers: { Range: 'bytes=500-1499' } }
    );
    expect(res.status).toHaveBeenCalledWith(206);
    expect(res.headers['content-length']).toBe('1000');
    expect(res.headers['content-range']).toBe('bytes 500-1499/5000');
    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(pipe).toHaveBeenCalledWith(res);
  });

  it('requests the full file when no Range header is sent', async () => {
    mockUpstream(200, {
      'content-type': 'video/mp4',
      'content-length': '5000',
      'accept-ranges': 'bytes',
    });
    const res = mockResponse();

    await getMediafileHandler()(request(), res, vi.fn());

    expect(nodeFetch).toHaveBeenCalledWith(
      'http://storage.ns.svc.cluster.local:8000/download/video.mp4',
      { headers: {} }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.headers['content-length']).toBe('5000');
    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(res.headers['content-range']).toBeUndefined();
  });
});
