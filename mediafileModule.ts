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
import type { ElodyModuleConfig as BaseElodyModuleConfig } from 'base-graphql';
import type { Express } from 'express';
import type { Environment } from 'base-graphql';

type ElodyModuleConfig = BaseElodyModuleConfig & {
  endpoints?: ((app: Express, environment: Environment) => void)[];
};

declare module "base-graphql" {
  interface DataSources {
    MediafileAPI: MediafileAPI;
    TranscodeService: MediafileTranscodeService;
    StorageAPI: StorageAPI;
    OcrService: OcrService;
  }
}

const mediafileModule = createModule({
  id: 'mediafileModule',
  dirname: __dirname,
  typeDefs: [mediafileSchema],
  resolvers: [mediafileResolver],
});

export const mediafileElodyConfig: ElodyModuleConfig = {
  modules: [mediafileModule],
  dataSources: {
    MediafileAPI: MediafileAPI,
    TranscodeService: MediafileTranscodeService,
    StorageAPI: StorageAPI,
    OcrService: OcrService,
  },
  endpoints: [
    (app) => applyUploadEndpoint(app),
    (app, env) => applyDownloadZipEndpoint(app),
    (app, env) => applyMediaFileEndpoint(app, env),
  ],
};

export { mediafileModule, mediafileResolver, mediafileSchema, MediafileAPI, MediafileTranscodeService, StorageAPI, OcrService };
