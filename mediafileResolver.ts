import {MediaFile, Resolvers} from "../../generated-types/type-defs";
import { GraphQLError } from "graphql";
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
    generateTranscode: async (
        _source,
        { mediafileIds, transcodeType, masterEntityId },
        { dataSources }
    ) => {
      const mediafiles: Promise<MediaFile>[] = [];
      let result = 'no-transcodes';

      try {
        mediafileIds.forEach((mediafileId: string) => {
          mediafiles.push(dataSources.CollectionAPI.getMediaFile(mediafileId));
        });

        Promise.all(mediafiles).then(
            async (resolvedMediafiles: MediaFile[]) => {
              if (!dataSources.TranscodeService)
                throw new GraphQLError(
                    'Transcode service has not been setup for this Elody GraphQL instance, please add its URL to the appConfig or .env file'
                );
              result = await dataSources.TranscodeService.generateTranscode(
                  resolvedMediafiles,
                  transcodeType,
                  masterEntityId as string
              );
            }
        );

        return result;
      } catch (e) {
        throw new GraphQLError(
            `Unable to transcode mediafiles to ${transcodeType}`
        );
      }
    },
    linkMediafileToEntity: async (
        _source,
        { entityId, mediaFileInput },
        { dataSources }
    ) => {
      const linkedResult: any =
          await dataSources.CollectionAPI.linkMediafileToEntity(
              entityId,
              mediaFileInput
          );
      return linkedResult;
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
        result = false;
      }
      return result;
    },
  },
};
