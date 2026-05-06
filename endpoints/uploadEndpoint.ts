import { AuthRESTDataSource, getCurrentEnvironment, extractErrorCode } from 'base-graphql';
import { Express, Request, Response } from 'express';
import { EntityInput, Entitytyping } from '../generated-types/type-defs';
import { Environment } from 'base-graphql';

export const applyUploadEndpoint = (app: Express) => {
  const env: Environment = getCurrentEnvironment();
  app.post(
    '/api/upload/batch',
    async (request: Request, response: Response) => {
      try {
        const filename: string = request.query['filename'] as string;
        const isDryRun: boolean = !!request.query['dry_run'];
        const mainJobId: string = request.query['main_job_id'] as string;
        const type: string | undefined = request.query['type'] as string;
        const extraMediafileType: string | undefined = request.query[
          'extra_mediafile_type'
        ] as string;

        const contentType = (request.headers['content-type'] || '').toLowerCase();
        const isExcel = contentType.includes('spreadsheetml.sheet');

        const chunks: Buffer[] = [];

        request.on('data', (chunk: Buffer) => {
          try {
            chunks.push(chunk);
          } catch (e) {
            console.log('Error while collecting file chunks:', e);
            response.status(500).end(JSON.stringify(e));
          }
        });

        request.on('end', async () => {
          try {
            const fileBuffer = Buffer.concat(chunks);

            const payload: string | Buffer = isExcel ? fileBuffer : fileBuffer.toString('utf-8');

            if (isDryRun) {
              const res = await __batchDryRun(
                request,
                response,
                payload,
                filename,
                extraMediafileType,
                type
              );
              response.end(JSON.stringify(res));
            } else {
              const result = await __batchEntities(
                request,
                response,
                payload,
                filename,
                mainJobId,
                extraMediafileType,
                type
              );
              const uploadUrls = result.links
                .filter((uploadUrl: string) => uploadUrl !== '')
                .map(
                  (line: string) =>
                    `${line}&parent_job_id=${result.parent_job_id}`
                );
              response.end(
                JSON.stringify({
                  entities: result.entities,
                  links: uploadUrls,
                  parent_job_id: result.parent_job_id,
                })
              );
            }
          } catch (e) {
            console.log('Error while parsing response:', e);
            response.status(500).end(JSON.stringify(e));
          }
        });
      } catch (exception: any) {
        response
          .status(extractErrorCode(exception))
          .end(JSON.stringify(exception));
      }
    }
  );

  app.post('/api/upload/xml', async (request: Request, response: Response) => {
    const env: Environment = getCurrentEnvironment();
    try {
      const datasource = new AuthRESTDataSource({
        environment: env,
        session: request.session,
      });
      let xml = '';
      request.on('data', (chunk: any) => {
        try {
          xml += chunk.toString();
        } catch (e) {
          console.log('Error while getting xml file:', e);
          response.status(500).end(JSON.stringify(e));
        }
      });

      request.on('end', async () => {
        try {
          const result = await datasource.post(
            `${env.api.collectionApiUrl}/marc21/v1/batch?xml_type=${request.query.upload_type}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'text/xml',
              },
              body: xml,
            }
          );

          response.status(200).setHeader('Content-Type', 'text/xml');
          response.end(JSON.stringify('success'));
        } catch (exception: any) {
          response
            .status(extractErrorCode(exception))
            .end(JSON.stringify(exception));
          response.end(JSON.stringify(exception));
        }
      });
    } catch (exception) {
      response
        .status(extractErrorCode(exception))
        .end(JSON.stringify(exception));
    }
  });

  app.post(
    '/api/upload/single',
    async (request: Request, response: Response) => {
      try {
        const entityInput = request.body.entityInput ?? {
          metadata: [],
          relations: [],
        };
        if (request.query?.hasRelation) {
          const uploadUrl = await __createMediafileForEntity(
            request,
            entityInput
          );
          response.end(JSON.stringify(uploadUrl));
        } else {
          const uploadUrl = await __createStandaloneMediafile(
            request,
            entityInput
          );
          response.end(JSON.stringify(uploadUrl));
        }
      } catch (exception: any) {
        response
          .status(extractErrorCode(exception))
          .end(JSON.stringify(exception));
      }
    }
  );

  app.post(`/api/upload/csv`, async (request: Request, response: Response) => {
    let csv = '';
    request.on('data', (chunk: any) => {
      try {
        csv += chunk.toString();
      } catch (e) {
        console.log('Error while getting csv file:', e);
        response.status(500).end(JSON.stringify(e));
      }
    });

    request.on('end', async () => {
      const env: Environment = getCurrentEnvironment();
      try {
        const clientIp: string = request.headers['x-forwarded-for'] as string;
        const datasource = new AuthRESTDataSource({
          environment: env,
          session: request.session,
          clientIp,
        });
        const result = await datasource.post(
          `${env.api.collectionApiUrl}/entities/${request.query.parentId}/order`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'text/csv',
            },
            body: csv,
          }
        );
        response.status(200).setHeader('Content-Type', 'text/csv');
        response.end();
      } catch (exception: any) {
        response
          .status(extractErrorCode(exception))
          .end(JSON.stringify(exception));
        response.end(JSON.stringify(exception));
      }
    });
  });
};

const __batchDryRun = async (
  request: Request,
  response: Response,
  payload: string | Buffer,
  filename: string,
  extraMediafileType: string | undefined,
  type: string | undefined
): Promise<any> => {
  const env: Environment = getCurrentEnvironment();
  let result = undefined;
  try {
    const clientIp: string = request.headers['x-forwarded-for'] as string;
    const acceptHeader: string = request.headers['accept'] as string || 'application/json';
    const contentTypeHeader: string = request.headers['content-type'] as string || 'text/csv';
    const datasource = new AuthRESTDataSource({
      environment: env,
      session: request.session,
      clientIp,
    });
    const params = new URLSearchParams({
      filename: filename,
      dry_run: '1',
      ...(extraMediafileType && { extra_mediafile_type: extraMediafileType }),
      ...(type && { type: type }),
    });

    result = await datasource.post(
      `${env.api.collectionApiUrl}/batch?${params.toString()}`,
      {
        headers: {
          'Content-Type': contentTypeHeader,
          'Accept': acceptHeader,
        },
        body: payload,
      }
    );
    return result;
  } catch (exception: any) {
    response.status(extractErrorCode(exception)).end(JSON.stringify(exception));
  }
};

const __batchEntities = async (
  request: Request,
  response: Response,
  payload: string | Buffer,
  filename: string,
  mainJobId: string,
  extraMediafileType: string | undefined,
  type: string | undefined
): Promise<any> => {
  const env: Environment = getCurrentEnvironment();
  const clientIp: string = request.headers['x-forwarded-for'] as string;
  const acceptHeader: string = request.headers['accept'] as string || 'application/json';
  const contentTypeHeader: string = request.headers['content-type'] as string || 'text/csv';
  const datasource = new AuthRESTDataSource({
    environment: env,
    session: request.session,
    clientIp,
  });
  let result: any;
  const params = new URLSearchParams({
    filename,
    ...(extraMediafileType && { extra_mediafile_type: extraMediafileType }),
    ...(mainJobId && { main_job_id: mainJobId }),
    ...(type && { type: type }),
  });

  try {
    result = await datasource.post(
      `${env.api.collectionApiUrl}/batch?${params.toString()}`,
      {
        headers: {
          'Content-Type': contentTypeHeader,
          'Accept': acceptHeader,
        },
        body: payload,
      }
    );
  } catch (exception: any) {
    response.status(extractErrorCode(exception)).end(JSON.stringify(exception));
  }
  return result;
};

const __createMediafileForEntity = async (
  request: Request,
  entityInput: EntityInput
): Promise<string> => {
  const env: Environment = getCurrentEnvironment();
  const clientIp: string = request.headers['x-forwarded-for'] as string;
  const datasource = new AuthRESTDataSource({
    environment: env,
    session: request.session,
    clientIp,
  });

  const body = {
    filename: `${request.query.filename}`,
    metadata: entityInput.metadata,
    relations: entityInput.relations,
  };
  body.metadata!.push({
    key: 'title',
    value: `${request.query.filename}`,
  });

  return await datasource.post(
    `${env?.api.collectionApiUrl}/entities/${request.query.entityId}/mediafiles`,
    {
      body,
      headers: {
        Accept: 'text/uri-list',
        'Content-Type': 'application/json',
      },
    }
  );
};

const __createStandaloneMediafile = async (
  request: Request,
  entityInput: EntityInput
) => {
  const env: Environment = getCurrentEnvironment();
  const clientIp: string = request.headers['x-forwarded-for'] as string;
  const datasource = new AuthRESTDataSource({
    environment: env,
    session: request.session,
    clientIp,
  });

  const body = {
    metadata: entityInput.metadata,
    relations: entityInput.relations,
    type:
      (request.query.type as string) ||
      env.customization?.uploadEntityTypeToCreate ||
      Entitytyping.BaseEntity,
  };
  body.metadata!.push({
    key: 'title',
    value: request.query.filename as string,
  });

  return await datasource.post(
    `${env.api.collectionApiUrl}/entities?create_mediafile=1&mediafile_filename=${request.query.filename}`,
    {
      body,
      headers: {
        Accept: 'text/uri-list',
        'Content-Type': 'application/json',
      },
    }
  );
};
