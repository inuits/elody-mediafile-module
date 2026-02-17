import { gql } from "graphql-modules";

export const mediafileQueries = gql`
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
`;
