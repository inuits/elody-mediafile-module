import { gql } from "graphql-modules";

export const mediafileQueries = gql`
    mutation GenerateTranscode(
        $mediafileIds: [String!]!
        $transcodeType: TranscodeType!
        $masterEntityId: String
    ) {
        generateTranscode(
            mediafileIds: $mediafileIds
            transcodeType: $transcodeType
            masterEntityId: $masterEntityId
        )
    }
    
    mutation linkMediafileToEntity(
        $entityId: String!
        $mediaFileInput: MediaFileInput!
    ) {
        linkMediafileToEntity(
            entityId: $entityId
            mediaFileInput: $mediaFileInput
        ) {
            _id
            filename
            original_file_location
            thumbnail_file_location
            mimetype
            metadata {
                key
                value
            }
        }
    }

    query GetPrimaryMediafileFromEntity($entityId: String!) {
        GetPrimaryMediafileFromEntity(entityId: $entityId) {
            ...mediafileInEntity
        }
    }
`;
