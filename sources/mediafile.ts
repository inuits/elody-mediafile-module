import { AuthRESTDataSource } from "base-graphql";
import {Collection, MediaFileInput} from "../../../generated-types/type-defs";

export class MediafileAPI extends AuthRESTDataSource {
    public baseURL = `${this.environment.api.collectionApiUrl}/`;

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
