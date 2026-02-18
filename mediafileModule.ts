import { createModule } from 'graphql-modules';
import { mediafileSchema } from './mediafileSchema.schema';
import { mediafileResolver } from './mediafileResolver';
import {MediafileAPI} from "./sources/mediafile";

declare module "base-graphql" { // Use the actual package name here
  interface DataSources {
    MediafileAPI: MediafileAPI;
  }
}

const mediafileModule = createModule({
  id: 'mediafileModule',
  dirname: __dirname,
  typeDefs: [mediafileSchema],
  resolvers: [mediafileResolver],
});

export { mediafileModule, mediafileResolver, mediafileSchema, MediafileAPI };
