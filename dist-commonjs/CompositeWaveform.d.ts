import { Waveform } from "./Waveform";
export declare class CompositeWaveform {
    private _waveforms;
    length: number;
    duration: number;
    pixelsPerSecond: number;
    secondsPerPixel: number;
    constructor(waveforms: any[]);
    min(index: number): any;
    max(index: number): any;
    _find(index: number): Waveform | null;
}
