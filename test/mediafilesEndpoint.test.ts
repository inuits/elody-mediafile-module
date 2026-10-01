import { describe, it, expect, vi } from 'vitest';
import { resolveExternalDownloadUrlToInternalUrl } from '../endpoints/mediafilesEndpoint';

vi.mock('base-graphql', () => ({}));

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
