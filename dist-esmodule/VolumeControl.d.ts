import { BaseComponent, IBaseComponentOptions } from "@iiif/base-component";
export interface IAVVolumeControlState {
    volume?: number;
}
export declare class AVVolumeControl extends BaseComponent {
    private _$element;
    private _$volumeSlider;
    private _$volumeMute;
    private _lastVolume;
    private _data;
    constructor(options: IBaseComponentOptions);
    protected _init(): boolean;
    set(data: IAVVolumeControlState): void;
    private _render;
    protected _resize(): void;
}
export declare class VolumeEvents {
    static VOLUME_CHANGED: string;
}
