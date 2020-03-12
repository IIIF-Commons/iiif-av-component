"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CompositeWaveform = /** @class */ (function () {
    function CompositeWaveform(waveforms) {
        var _this = this;
        this.length = 0;
        this.duration = 0;
        this.pixelsPerSecond = Number.MAX_VALUE;
        this.secondsPerPixel = Number.MAX_VALUE;
        this._waveforms = [];
        waveforms.forEach(function (waveform) {
            _this._waveforms.push({
                start: _this.length,
                end: _this.length + waveform.adapter.length,
                waveform: waveform
            });
            _this.length += waveform.adapter.length;
            _this.duration += waveform.duration;
            _this.pixelsPerSecond = Math.min(_this.pixelsPerSecond, waveform.pixels_per_second);
            _this.secondsPerPixel = Math.min(_this.secondsPerPixel, waveform.seconds_per_pixel);
        });
    }
    // Note: these could be optimised, assuming access is sequential
    CompositeWaveform.prototype.min = function (index) {
        var waveform = this._find(index);
        return waveform ? waveform.waveform.min_sample(index - waveform.start) : 0;
    };
    CompositeWaveform.prototype.max = function (index) {
        var waveform = this._find(index);
        return waveform ? waveform.waveform.max_sample(index - waveform.start) : 0;
    };
    CompositeWaveform.prototype._find = function (index) {
        var waveforms = this._waveforms.filter(function (waveform) {
            return index >= waveform.start && index < waveform.end;
        });
        return waveforms.length > 0 ? waveforms[0] : null;
    };
    return CompositeWaveform;
}());
exports.CompositeWaveform = CompositeWaveform;
//# sourceMappingURL=CompositeWaveform.js.map