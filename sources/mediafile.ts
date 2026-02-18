import { AuthRESTDataSource, setId, setType } from "base-graphql";
import {
    Collection,
    Entitytyping, Maybe,
    MediaFileInput, MediaFileMetadataInput,
} from "../../../generated-types/type-defs";

export class MediafileAPI extends AuthRESTDataSource {
    public baseURL = `${this.environment.api.collectionApiUrl}/`;

    async getMediaFile(mediaFileId: String): Promise<any> {
        const res = await this.get(`${Collection.Mediafiles}/${mediaFileId}`);
        setId(res);
        setType(res, Entitytyping.Mediafile);
        return res;
    }

    async patchMetaDataMediaFile(
        mediafileId: String,
        mediaFileMetadata: Maybe<MediaFileMetadataInput>[]
    ): Promise<any> {
        return await this.patch(`${Collection.Mediafiles}/${mediafileId}`, {
            body: {
                metadata: mediaFileMetadata,
            },
        });
    }

    async getAssetsRelationedWithMediafFile(mediaFileId: String): Promise<any> {
        const assets = await this.get(
            `${Collection.Mediafiles}/${mediaFileId}/assets`
        );
        assets.forEach((asset: any) => {
            setId(asset);
        });
        return assets;
    }



    async linkMediafileToEntity(
        entityId: String,
        mediaFileInput: MediaFileInput
    ): Promise<any> {
        const res = await this.post(
            `${Collection.Entities}/${entityId}/mediafiles`,
            {
                body: mediaFileInput,
            }
        );
        return res;
    }
}
