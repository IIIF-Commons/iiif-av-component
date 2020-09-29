import { IAVVolumeControlState } from '../interfaces/volume-control-state';
import { BaseComponent, IBaseComponentOptions } from '@iiif/base-component';
export declare class AVVolumeControl extends BaseComponent {
    private _$volumeSlider;
    private _$volumeMute;
    private _lastVolume;
    private _$element;
    private _data;
    constructor(options: IBaseComponentOptions);
    protected _init(): boolean;
    set(data: IAVVolumeControlState): void;
    private _render;
    protected _resize(): void;
}
