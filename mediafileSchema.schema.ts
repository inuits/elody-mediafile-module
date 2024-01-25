import { gql } from "graphql-modules";
export const mediafileSchema = gql`
  enum Entitytyping {
    asset
    mediafile
  }

  type MediaFilePostReturn {
    url: String
  }

  type MediaFileMetadata {
    key: String
    value: String
  }

  input MediaFileMetadataInput {
    key: String
    value: String
  }

  input MediaFileInput {
    _id: String
    original_file_location: String
    thumbnail_file_location: String
    filename: String
    entities: [String]
    metadata: [MediaFileMetadataInput]
    mimetype: String
    is_primary: Boolean
    is_primary_thumbnail: Boolean
    user: String
  }

  type MediaFile {
    _id: String!
    original_file_location: String
    thumbnail_file_location: String
    transcode_filename: String
    filename: String
    entities: [String]
    metadata: [MediaFileMetadata]
    mimetype: String
    isPublic: Boolean
    is_primary: Boolean
    is_primary_thumbnail: Boolean
    user: String
  }

  type Asset implements Entity {
    id: String!
    uuid: String!
    type: String!
    teaserMetadata: teaserMetadata
    permission: [Permission]
    intialValues: IntialValues!
    allowedViewModes: AllowedViewModes
    relationValues: RelationValues
    entityView: ColumnList!
    advancedFilters: AdvancedFilters
    sortOptions: SortOptions
    createFormFields: FormFields
    bulkOperationOptions: BulkOperationOptions
  }

  type Query {
    getMediafile(mediafileId: String): MediaFile
  }

  type Mutation {
    patchMediaFileMetadata(
      MediafileId: String!
      MediaFileMetadata: [MediaFileMetadataInput]!
    ): MediaFile
    getAssetsRelationedWithMediafFile(mediaFileId: String!): [Asset]
  }
`;
