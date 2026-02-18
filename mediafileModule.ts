import { createModule } from 'graphql-modules';
import { mediafileSchema } from './mediafileSchema.schema';
import { mediafileResolver } from './mediafileResolver';
import {MediafileAPI} from "./sources/mediafile";
import {MediafileTranscodeService} from "./sources/mediafileTranscode"

declare module "base-graphql" {
  interface DataSources {
    MediafileAPI: MediafileAPI;
    TranscodeService: MediafileTranscodeService;
  }
}

const mediafileModule = createModule({
  id: 'mediafileModule',
  dirname: __dirname,
  typeDefs: [mediafileSchema],
  resolvers: [mediafileResolver],
});

export { mediafileModule, mediafileResolver, mediafileSchema, MediafileAPI, MediafileTranscodeService };
