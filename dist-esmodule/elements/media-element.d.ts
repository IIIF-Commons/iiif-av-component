import { MediaFormat } from '../media-formats/abstract-media-format';
import { MediaOptions } from '../types/media-options';
import { MediaSource } from '../types/media-source';
export declare class MediaElement {
    type: string;
    format?: string;
    mediaSource: string;
    source: MediaSource;
    element: HTMLMediaElement;
    instance: MediaFormat;
    mediaSyncMarginSecs: number;
    constructor(source: MediaSource, mediaOptions?: MediaOptions);
    syncClock(time: number): void;
    getCanvasId(): string;
    isWithinRange(time: number): boolean;
    load(withAudio?: boolean): Promise<void>;
    setSize(top: number, left: number, width: number, height: number): void;
    isDash(): boolean | "" | undefined;
    isHls(): any;
    isMpeg(): boolean;
    stop(): void;
    play(time?: number): Promise<void>;
    pause(): void;
    isBuffering(): boolean;
}
