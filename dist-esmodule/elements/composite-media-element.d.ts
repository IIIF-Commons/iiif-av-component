/// <reference types="jquery" />
/// <reference types="jqueryui" />
import { MediaElement } from './media-element';
export declare class CompositeMediaElement {
    elements: MediaElement[];
    activeElement: MediaElement;
    playing: boolean;
    canvasMap: {
        [id: string]: MediaElement[];
    };
    private _onPlay;
    private _onPause;
    constructor(mediaElements: MediaElement[]);
    syncClock(time: number): void;
    onPlay(func: (canvasId: string, time: number, el: HTMLMediaElement) => void): void;
    onPause(func: (canvasId: string, time: number, el: HTMLMediaElement) => void): void;
    findElementInRange(canvasId: string, time: number): MediaElement | undefined;
    appendTo($element: JQuery): void;
    load(): Promise<void>;
    seekTo(canvasId: string, time: number): Promise<void>;
    play(canvasId?: string, time?: number): Promise<void>;
    pause(): void;
    setVolume(volume: number): void;
    isBuffering(): boolean;
}
