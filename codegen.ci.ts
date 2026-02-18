import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: './baseModule/*.schema.ts',
  generates: {
    '../../generated-types/type-defs.ts': {
      plugins: [{ typescript: {} }, { 'typescript-resolvers': {} }],
    },
  },
  config: {
    enumsAsTypes: false,
    preResolveTypes: true,
    scalars: { Void: 'void' },
    useTypeImports: false,
    dedupeFragments: true,
  },
};

export default config;
