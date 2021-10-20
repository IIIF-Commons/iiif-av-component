import { Waveform } from './waveform';

// todo: migrate to latest version: https://github.com/bbc/waveform-data.js/blob/master/doc/migration-guide.md
export class CompositeWaveform {
  private _waveforms: Waveform[];
  public length = 0;
  public duration = 0;
  public pixelsPerSecond: number = Number.MAX_VALUE;
  public secondsPerPixel: number = Number.MAX_VALUE;
  private timeIndex: { [r: number]: Waveform } = {};
  private minIndex: { [r: number]: number } = {};
  private maxIndex: { [r: number]: number } = {};

  constructor(waveforms: any[]) {
    this._waveforms = [];

    waveforms.forEach((waveform) => {
      this._waveforms.push({
        start: this.length,
        end: this.length + waveform.adapter.length,
        waveform,
      });

      this.length += waveform.adapter.length;
      this.duration += waveform.duration;
      this.pixelsPerSecond = Math.min(this.pixelsPerSecond, waveform.pixels_per_second);
      this.secondsPerPixel = Math.min(this.secondsPerPixel, waveform.seconds_per_pixel);
    });
  }

  // Note: these could be optimised, assuming access is sequential

  min(index: number) {
    if (typeof this.minIndex[index] === 'undefined') {
      const waveform = this._find(index);
      this.minIndex[index] = waveform ? waveform.waveform.min_sample(index - waveform.start) : 0;
    }
    return this.minIndex[index];
  }

  max(index: number) {
    if (typeof this.maxIndex[index] === 'undefined') {
      const waveform = this._find(index);
      this.maxIndex[index] = waveform ? waveform.waveform.max_sample(index - waveform.start) : 0;
    }
    return this.maxIndex[index];
  }

  _find(index: number) {
    if (typeof this.timeIndex[index] === 'undefined') {
      // eslint-disable-next-line no-shadow
      const waveform = this._waveforms.find((waveform) => {
        return index >= waveform.start && index < waveform.end;
      });

      if (!waveform) {
        return null;
      }

      this.timeIndex[index] = waveform;
    }
    return this.timeIndex[index];
  }
}
