import { Waveform } from "./Waveform";

export class CompositeWaveform {
  private _waveforms: Waveform[];
  public length: number = 0;
  public duration: number = 0;
  public pixelsPerSecond: number = Number.MAX_VALUE;
  public secondsPerPixel: number = Number.MAX_VALUE;

  constructor(waveforms: any[]) {
    this._waveforms = [];

    waveforms.forEach(waveform => {
      this._waveforms.push({
        start: this.length,
        end: this.length + waveform.adapter.length,
        waveform
      });

      this.length += waveform.adapter.length;
      this.duration += waveform.duration;
      this.pixelsPerSecond = Math.min(
        this.pixelsPerSecond,
        waveform.pixels_per_second
      );
      this.secondsPerPixel = Math.min(
        this.secondsPerPixel,
        waveform.seconds_per_pixel
      );
    });
  }

  // Note: these could be optimised, assuming access is sequential

  min(index: number) {
    const waveform = this._find(index);
    return waveform ? waveform.waveform.min_sample(index - waveform.start) : 0;
  }

  max(index: number) {
    const waveform = this._find(index);
    return waveform ? waveform.waveform.max_sample(index - waveform.start) : 0;
  }

  _find(index: number) {
    const waveforms = this._waveforms.filter(waveform => {
      return index >= waveform.start && index < waveform.end;
    });

    return waveforms.length > 0 ? waveforms[0] : null;
  }
}
