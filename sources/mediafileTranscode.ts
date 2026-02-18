import { TranscodeService } from 'base-graphql';
import {MediaFile, TranscodeType} from "../../../generated-types/type-defs";

export class MediafileTranscodeService extends TranscodeService {
    async generateTranscode(
        mediafiles: MediaFile[],
        transcodeType: TranscodeType,
        masterEntityId: string | undefined = undefined
    ): Promise<any> {
        const mediafileObject = { mediafiles: mediafiles };
        return await this.post(
            `transcode/${transcodeType}${
                masterEntityId ? '?master_entity_id=' + masterEntityId : ''
            }`,
            { body: mediafileObject, headers: { 'Content-Type': 'application/json' } }
        );
    }
}