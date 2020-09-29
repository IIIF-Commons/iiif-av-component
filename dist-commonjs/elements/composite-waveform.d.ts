import { Waveform } from './waveform';
export declare class CompositeWaveform {
    private _waveforms;
    length: number;
    duration: number;
    pixelsPerSecond: number;
    secondsPerPixel: number;
    private timeIndex;
    private minIndex;
    private maxIndex;
    constructor(waveforms: any[]);
    min(index: number): number;
    max(index: number): number;
    _find(index: number): Waveform | null;
}
