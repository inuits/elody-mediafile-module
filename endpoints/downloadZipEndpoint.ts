import { Express, Request, Response } from 'express';
import { getCurrentEnvironment, fetchWithTokenRefresh } from 'base-graphql';

export const applyDownloadZipEndpoint = (app: Express) => {
  app.get(
    `/api/download/zip/:id`,
    async (request: Request, response: Response) => {
      try {
        const environment = getCurrentEnvironment();
        const entityId = request.params.id;

        const transcodeResponse = await fetchWithTokenRefresh(
          `${environment.api.transcodeService}transcode/zip`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ download_entity_id: entityId }),
          },
          request
        );

        console.log(`${environment.api.transcodeService}transcode/zip`);

        if (!transcodeResponse.ok) {
          response
            .status(transcodeResponse.status)
            .end(transcodeResponse.statusText);
          return;
        }

        const contentType =
          transcodeResponse.headers.get('Content-Type') || 'application/zip';
        const contentDisposition = transcodeResponse.headers.get(
          'Content-Disposition'
        );

        response.setHeader('Content-Type', contentType);
        if (contentDisposition) {
          response.setHeader('Content-Disposition', contentDisposition);
        }

        const buffer = await transcodeResponse.arrayBuffer();
        response.status(200).end(Buffer.from(buffer));
      } catch (exception: any) {
        const status = exception?.extensions?.response?.status || 500;
        const statusText =
          exception?.extensions?.response?.statusText || String(exception);
        response.status(status).end(statusText);
      }
    }
  );
};
