import { gql } from "graphql-modules";

export const mediafileModuleQueries = gql`
    query GetMediafiles(
        $type: Entitytyping!
        $limit: Int
        $skip: Int
        $searchValue: SearchFilter!
        $advancedSearchValue: [FilterInput]
        $advancedFilterInputs: [AdvancedFilterInput!]!
        $searchInputType: SearchInputType
    ) {
        Entities(
            type: $type
            limit: $limit
            skip: $skip
            searchValue: $searchValue
            advancedSearchValue: $advancedSearchValue
            advancedFilterInputs: $advancedFilterInputs
            searchInputType: $searchInputType
        ) {
            count
            limit
            results {
                id
                uuid
                type
                ... on MediaFileEntity {
                    ...mediafileInEntity
                }
            }
            __typename
        }
        __typename
    }

    query GetMediafilesInEntityFilters($entityType: String!) {
        EntityTypeFilters(type: $entityType) {
            advancedFilters {
                type: advancedFilter(type: type) {
                    type
                    defaultValue(value: "mediafile")
                    hidden(value: true)
                }
                technical_origin: advancedFilter(
                    type: text
                    key: ["elody:1|technical_origin"]
                ) {
                    type
                    key
                    hidden(value: true)
                    defaultValue(value: "original")
                }
                relation: advancedFilter(
                    type: selection
                    parentKey: "relations"
                    key: "hasMediafile"
                ) {
                    type
                    key
                    parentKey
                    defaultValue(value: "")
                    hidden(value: true)
                }
            }
        }
    }

    query GetBulkOperationsForMediafiles {
        CustomBulkOperations {
            bulkOperationOptions {
                options(
                    input: [
                        {
                            icon: PlusCircle
                            label: "bulk-operations.add-existing-relation"
                            value: "addRelation"
                            actionContext: {
                                activeViewMode: readMode
                                entitiesSelectionType: noneSelected
                                labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected"
                            }
                            bulkOperationModal: {
                                typeModal: DynamicForm
                                formQuery: "GetImportMediafilesQuery"
                                askForCloseConfirmation: true
                                neededPermission: canupdate
                            }
                        }
                        {
                            icon: DownloadAlt
                            label: "bulk-operations.download-mediafiles"
                            value: "downloadMediafiles"
                            actionContext: {
                                activeViewMode: readMode
                                entitiesSelectionType: someSelected
                                labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-someselected"
                            }
                            bulkOperationModal: {
                                typeModal: DynamicForm
                                formQuery: "GetDownloadMediafilesForm"
                                formRelationType: "hasMediafile"
                                askForCloseConfirmation: true
                                neededPermission: cancreate
                            }
                        }
                    ]
                ) {
                    icon
                    label
                    value
                    primary
                    actionContext {
                        ...actionContext
                    }
                    bulkOperationModal {
                        ...bulkOperationModal
                    }
                }
            }
        }
    }
    
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
