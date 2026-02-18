import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: './*.schema.ts',
  generates: {
    '../../generated-types/type-defs.ts': {
      plugins: [{ typescript: {} }],
    },
  },
  config: {
    onlyEnums: true,
    enumsAsTypes: false,
    scalars: { Void: 'void' },
  },
};

export default config;
