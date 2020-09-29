import { MediaOptions } from '../types/media-options';
import { MediaFormat } from './abstract-media-format';
export declare class DefaultFormat extends MediaFormat {
    constructor(source: string, options?: MediaOptions);
}
