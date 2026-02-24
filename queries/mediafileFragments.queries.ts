import { gql } from "graphql-modules";

export const mediafileModuleQueries = gql`
fragment mediafileInEntity on MediaFileEntity {
...minimalBaseEntity
    intialValues {
        id
        filename: keyValue(key: "filename", source: root)
        original_filename: keyValue(key: "original_filename", source: root)
        display_filename: keyValue(key: "display_filename", source: root)
        original_file_location: keyValue(
            key: "original_file_location"
        source: root
    )
        transcode_file_location: keyValue(
            key: "transcode_file_location"
        source: derivatives
        technicalOrigin: "transcode"
    )
        thumbnail: keyValue(key: "filename", source: root)
        mimetype: keyValue(key: "mimetype", source: root)
        height: keyValue(key: "img_height", source: root)
        width: keyValue(key: "img_width", source: root)
        __typename
    }
    teaserMetadata {
        thumbnail: thumbnail {
            key(input: "thumbnail")
            __typename
        }
        original_filename: metaData {
            label(input: "metadata.labels.filename")
            key(input: "original_filename")
            __typename
        }
        contextMenuActions {
            doLinkAction {
                label(input: "contextMenu.contextMenuLinkAction.followLink")
                icon(input: "AngleRight")
                __typename
            }
            primaryMediafile: doGeneralAction {
                label(
                    input: "contextMenu.contextMenuGeneralAction.setPrimaryMediafile"
            )
                action(input: SetPrimaryMediafile)
                icon(input: "Link")
                __typename
            }
            primaryThumbnail: doGeneralAction {
                label(
                    input: "contextMenu.contextMenuGeneralAction.setPrimaryThumbnail"
            )
                action(input: SetPrimaryThumbnail)
                icon(input: "ImageCheck")
                __typename
            }
            deleteRelation: doElodyAction {
                label(input: "contextMenu.contextMenuElodyAction.delete-relation")
                action(input: DeleteRelation)
                icon(input: "Trash")
                __typename
            }
            deleteEntity: doElodyAction {
                label(input: "contextMenu.contextMenuElodyAction.delete-entity")
                action(input: DeleteEntity)
                icon(input: "Trash")
                __typename
            }
            __typename
        }
    }
    allowedViewModes {
        viewModes(
            input: [{ viewMode: ViewModesList }, { viewMode: ViewModesGrid }]
    ) {
        ...viewModes
        }
    }
    __typename
}
`