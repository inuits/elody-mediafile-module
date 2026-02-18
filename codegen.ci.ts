import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: './*.schema.ts',
  generates: {
    '../../generated-types/type-defs.ts': {
      plugins: [{ typescript: { onlyEnums: true, enumsAsTypes: false, skipTypename: true} }],
    },
  },
};

export default config;
