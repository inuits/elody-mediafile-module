import { gql } from 'graphql-modules';
export const mediafileSchema = gql`
  # Generic
  scalar Upload

  # mediafileTypes
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

  type Query {
    getMediafile(mediafileId: String): MediaFile
  }

  type Mutation {
    postMediaFile(mediaFileInput: MediaFileInput!, file: Upload!): MediaFile
    patchMediaFileMetadata(
      MediafileId: String!
      MediaFileMetadata: [MediaFileMetadataInput]!
    ): MediaFile
    getAssetsRelationedWithMediafFile(mediaFileId: String!): [Asset]
    uploadFile(id: String!, file: Upload!): String
  }
`;
