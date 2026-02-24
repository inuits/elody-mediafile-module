import {Entitytyping, MediaFile, MediaFileEntity, Resolvers} from "./generated-types/type-defs";
import { GraphQLError } from "graphql";
import {ContextValue, type CollectionAPIEntity, getEntityId, resolveRelations} from "base-graphql";

export const mediafileResolver: Resolvers<ContextValue> = {
  Query: {
    getMediafile: async (_source, { mediafileId }, { dataSources }) => {
      return await dataSources.MediafileAPI.getMediaFile(
        mediafileId as string
      );
    },
    FetchMediafilesOfEntity: async (
        _source,
        { entityIds },
        { dataSources }
    ) => {
      const mediafiles: MediaFileEntity[] = [];
      for (const index in entityIds) {
        const response = await dataSources.MediafileAPI.getMediafiles(
            entityIds[index]
        );
        mediafiles.push(...response.results);
      }
      return mediafiles;
    },
    GetPrimaryMediafileFromEntity: async (_source, {entityId}, {dataSources}) => {
      const entity: CollectionAPIEntity = await dataSources.CollectionAPI.getEntity(entityId, Entitytyping.BaseEntity)  // Todo: Have a look if we can remove the type parameter from the getEntity function
      const primaryMediafileId = entity.primary_mediafile_id
      if (!primaryMediafileId) throw new GraphQLError("Entity does not have a primary mediafile or access has been restricted")
      return await dataSources.CollectionAPI.getEntity(primaryMediafileId, Entitytyping.Mediafile)
    }
  },
  Mutation: {
    patchMediaFileMetadata: async (
      _source,
      { MediafileId, MediaFileMetadata },
      { dataSources }
    ) => {
      return dataSources.MediafileAPI.patchMetaDataMediaFile(
        MediafileId,
        MediaFileMetadata
      );
    },
    getAssetsRelationedWithMediafFile: async (
      _source,
      { mediaFileId },
      { dataSources }
    ) => {
      return dataSources.MediafileAPI.getAssetsRelationedWithMediafFile(
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
          mediafiles.push(dataSources.MediafileAPI.getMediaFile(mediafileId));
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
          await dataSources.MediafileAPI.linkMediafileToEntity(
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
  MediaFileEntity: {
    id: async (parent: any) => {
      return getEntityId(parent);
    },
    uuid: async (parent: any) => {
      return getEntityId(parent);
    },
    type: async (parent: any) => 'MediaFile',
    intialValues: async (parent: any, _args) => {
      return parent;
    },
    allowedViewModes: async (parent: any, _args, { dataSources }) => {
      return parent;
    },
    relationValues: async (parent: any, _args, { dataSources }) => {
      return resolveRelations(parent);
    },
    entityView: async (parent: any, _args, { dataSources }) => {
      return parent;
    },
    teaserMetadata: async (parent: any, _args, { dataSources }) => {
      return parent;
    },
  },
};
