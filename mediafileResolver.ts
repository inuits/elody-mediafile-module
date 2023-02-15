import { Resolvers } from "../../generated-types/type-defs";
import { ContextValue } from "base-graphql";

export const mediafileResolver: Resolvers<ContextValue> = {
  Query: {
    getMediafile: async (_source, { mediafileId }, { dataSources }) => {
      return await dataSources.CollectionAPI.getMediaFile(
        mediafileId as string
      );
    },
  },
  Mutation: {
    patchMediaFileMetadata: async (
      _source,
      { MediafileId, MediaFileMetadata },
      { dataSources }
    ) => {
      return dataSources.CollectionAPI.patchMetaDataMediaFile(
        MediafileId,
        MediaFileMetadata
      );
    },
    getAssetsRelationedWithMediafFile: async (
      _source,
      { mediaFileId },
      { dataSources }
    ) => {
      return dataSources.CollectionAPI.getAssetsRelationedWithMediafFile(
        mediaFileId
      );
    },
  },
  MediaFile: {
    isPublic: async (parent: any, _args, { dataSources }) => {
      let result = false;
      try {
        if (
          parent.metadata.filter(
            (metaDataItem: { key: string }) =>
              metaDataItem.key === "publication_status"
          )[0]
        ) {
          result =
            parent.metadata.filter(
              (metaDataItem: { key: string }) =>
                metaDataItem.key === "publication_status"
            )[0].value === "publiek";
        } else {
          result = false;
        }
      } catch (e) {
        console.log(e);
      }
      return result;
    },
  },
};
