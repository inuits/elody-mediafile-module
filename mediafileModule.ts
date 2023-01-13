import { createModule } from 'graphql-modules';
import { mediafileSchema } from './mediafileSchema.schema';
import { mediafileResolver } from './mediafileResolver';

const mediafileModule = createModule({
  id: 'mediafileModule',
  dirname: __dirname,
  typeDefs: [mediafileSchema],
  resolvers: [mediafileResolver],
});

export { mediafileModule, mediafileResolver, mediafileSchema };
