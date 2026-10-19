import { createModule } from 'graphql-modules';
import { mediafileSchema } from './mediafileSchema.schema';
import { mediafileResolver } from './mediafileResolver';
import { MediafileAPI } from './sources/mediafile';
import { MediafileTranscodeService } from './sources/mediafileTranscode';
import { StorageAPI } from './sources/storage';
import { OcrService } from './sources/ocr';
import { applyUploadEndpoint } from './endpoints/uploadEndpoint';
import { applyDownloadZipEndpoint } from './endpoints/downloadZipEndpoint';
import applyMediaFileEndpoint from './endpoints/mediafilesEndpoint';
import { defineElodyModule } from 'base-graphql';

declare module "base-graphql" {
  interface DataSources {
    MediafileAPI: MediafileAPI;
    TranscodeService: MediafileTranscodeService;
    StorageAPI: StorageAPI;
    OcrService: OcrService;
  }
}

const mediafileModule = defineElodyModule({
  name: 'mediafileModule',
  graphqlModule: createModule({
    id: 'mediafileModule',
    dirname: __dirname,
    typeDefs: [mediafileSchema],
    resolvers: [mediafileResolver],
  }),
  dataSources: [
    { name: 'MediafileAPI', source: MediafileAPI },
    { name: 'TranscodeService', source: MediafileTranscodeService },
    { name: 'StorageAPI', source: StorageAPI },
    { name: 'OcrService', source: OcrService },
  ],
  endpoints: [
    (app) => applyUploadEndpoint(app),
    (app) => applyDownloadZipEndpoint(app),
    (app, environment) => applyMediaFileEndpoint(app, environment),
  ],
});

export {
  mediafileModule,
  mediafileResolver,
  mediafileSchema,
  MediafileAPI,
  MediafileTranscodeService,
  StorageAPI,
  OcrService,
};
