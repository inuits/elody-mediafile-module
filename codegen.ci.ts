import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    './baseModule/*.schema.ts',
    './*.schema.ts',
    './node_modules/**/*.schema.ts',
  ],
  documents: ['./baseModule/**/*.queries.ts', './queries/**/*.queries.ts', './node_modules/**/*.queries.ts'],
  generates: {
    './generated-types/type-defs.ts': {
      plugins: [{ typescript: {} }, { 'typescript-resolvers': {} }],
    },
  },
};

export default config;
