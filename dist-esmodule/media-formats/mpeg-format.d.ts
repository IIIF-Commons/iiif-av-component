import { MediaOptions } from '../types/media-options';
import { MediaFormat } from './abstract-media-format';
export declare class MpegFormat extends MediaFormat {
    constructor(source: string, options?: MediaOptions);
    attachTo(element: HTMLMediaElement): void;
}
