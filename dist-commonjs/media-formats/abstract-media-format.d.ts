import { MediaOptions } from '../types/media-options';
export declare abstract class MediaFormat {
    options: MediaOptions;
    source: string;
    protected constructor(source: string, options?: MediaOptions);
    attachTo(element: HTMLMediaElement): void;
}
