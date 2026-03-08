import { gql } from "graphql-modules";
export const mediafileSchema = gql`
  enum Entitytyping {
    mediafile
  }

  enum Collection {
      mediafiles
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

  interface Entity {
      id: String!
      uuid: String!
      type: String!
      teaserMetadata: teaserMetadata
      intialValues: IntialValues!
      allowedViewModes: AllowedViewModes
      relationValues: JSON
      entityView: ColumnList!
      advancedFilters: AdvancedFilters
      sortOptions: SortOptions
      bulkOperationOptions: BulkOperationOptions
      previewComponent: PreviewComponent
  }

  type MediaFileEntity implements Entity {
      id: String!
      uuid: String!
      type: String!
      teaserMetadata: teaserMetadata
      intialValues: IntialValues!
      allowedViewModes: AllowedViewModes
      relationValues: JSON
      entityView: ColumnList!
      advancedFilters: AdvancedFilters
      sortOptions: SortOptions
      bulkOperationOptions: BulkOperationOptions
      previewComponent: PreviewComponent
      deleteQueryOptions: DeleteQueryOptions
      mapElement: MapElement
  }

  type Media implements Entity {
    id: String!
    uuid: String!
    type: String!
    teaserMetadata: teaserMetadata
    intialValues: IntialValues!
    allowedViewModes: AllowedViewModes
    relationValues: JSON
    entityView: ColumnList!
    advancedFilters: AdvancedFilters
    sortOptions: SortOptions
    bulkOperationOptions: BulkOperationOptions
    previewComponent: PreviewComponent
    deleteQueryOptions: DeleteQueryOptions
    mapElement: MapElement
  }

  type Query {
    getMediafile(mediafileId: String): MediaFile
    GetPrimaryMediafileFromEntity(entityId: String!): Entity
    FetchMediafilesOfEntity(entityIds: [String!]!): [MediaFileEntity]!
  }

  type Mutation {
    patchMediaFileMetadata(
      MediafileId: String!
      MediaFileMetadata: [MediaFileMetadataInput]!
    ): MediaFile
    getAssetsRelationedWithMediafFile(mediaFileId: String!): [Entity]
    getMediaRelationedWithMediafFile(mediaFileId: String!): [Media]
    generateTranscode(
    mediafileIds: [String!]!
    transcodeType: TranscodeType!
    masterEntityId: String
    ): String
    linkMediafileToEntity(
    entityId: String!
    mediaFileInput: MediaFileInput!
    ): MediaFile
  }
`;
