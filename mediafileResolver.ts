import { Resolvers } from "../../generated-types/type-defs";
import { ContextValue } from "base-graphql";
import { GraphQLUpload } from 'graphql-upload-ts';

export const mediafileResolver: Resolvers<ContextValue> = {
  Upload: GraphQLUpload,
  Query: {
    getMediafile: async (_source, { mediafileId }, { dataSources }) => {
      return await dataSources.CollectionAPI.getMediaFile(
        mediafileId as string
      );
    },
  },
  Mutation: {
    postMediaFile: async (
      _source,
      { mediaFileInput, file },
      { dataSources }
    ) => {
      const mediaFileResult: any =
        await dataSources.CollectionAPI.postMediaFile(mediaFileInput);
      await dataSources.StorageAPI.uploadFile(mediaFileResult._key, file);
      const mediaFileById = await dataSources.CollectionAPI.getMediaFile(
        mediaFileResult._key
      );
      return mediaFileById;
    },
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
