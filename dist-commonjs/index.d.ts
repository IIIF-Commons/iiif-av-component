import { Helper } from "@iiif/manifold";
import { BaseComponent, IBaseComponentOptions } from "@iiif/base-component";
import { CanvasInstance } from "./CanvasInstance";
export interface IAVComponentContent {
    currentTime: string;
    collapse: string;
    duration: string;
    expand: string;
    mute: string;
    next: string;
    pause: string;
    play: string;
    previous: string;
    unmute: string;
    fullscreen: string;
}
export interface IAVComponentData {
    [key: string]: any;
    adaptiveAuthEnabled?: boolean;
    autoPlay?: boolean;
    autoSelectRange?: boolean;
    canvasId?: string;
    constrainNavigationToRange?: boolean;
    content?: IAVComponentContent;
    defaultAspectRatio?: number;
    doubleClickMS?: number;
    helper?: Helper;
    halveAtWidth?: number;
    limitToRange?: boolean;
    posterImageRatio?: number;
    rangeId?: string;
    virtualCanvasEnabled?: boolean;
    waveformBarSpacing?: number;
    waveformBarWidth?: number;
    waveformColor?: string;
}
export declare class AVComponent extends BaseComponent {
    options: IBaseComponentOptions;
    canvasInstances: CanvasInstance[];
    private _$element;
    private _data;
    private _checkAllMediaReadyInterval;
    private _checkAllWaveformsReadyInterval;
    private _readyMedia;
    private _readyWaveforms;
    private _posterCanvasWidth;
    private _posterCanvasHeight;
    private _$posterContainer;
    private _$posterImage;
    private _$posterExpandButton;
    private _posterImageExpanded;
    constructor(options: IBaseComponentOptions);
    protected _init(): boolean;
    data(): IAVComponentData;
    set(data: IAVComponentData): void;
    private _render;
    reset(): void;
    private _reset;
    private _checkAllMediaReady;
    private _checkAllWaveformsReady;
    private _getCanvasInstancesWithWaveforms;
    private _getCanvases;
    private _initCanvas;
    private _prevRange;
    private _nextRange;
    private _setCanvasInstanceVolumes;
    private _getNormaliseCanvasId;
    private _getCanvasInstanceById;
    private _getCurrentCanvas;
    private _rewind;
    play(): void;
    pause(): void;
    playRange(rangeId: string): void;
    showCanvas(canvasId: string): void;
    private _logMessage;
    private _getPosterImageCss;
    resize(): void;
}
export declare class Events {
    static MEDIA_READY: string;
    static MEDIA_ERROR: string;
    static LOG: string;
    static RANGE_CHANGED: string;
    static WAVEFORM_READY: string;
    static WAVEFORMS_READY: string;
    static FULLSCREEN: string;
}
