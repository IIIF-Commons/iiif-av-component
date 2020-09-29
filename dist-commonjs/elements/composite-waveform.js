"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CompositeWaveform = /** @class */ (function () {
    function CompositeWaveform(waveforms) {
        var _this = this;
        this.length = 0;
        this.duration = 0;
        this.pixelsPerSecond = Number.MAX_VALUE;
        this.secondsPerPixel = Number.MAX_VALUE;
        this.timeIndex = {};
        this.minIndex = {};
        this.maxIndex = {};
        this._waveforms = [];
        waveforms.forEach(function (waveform) {
            _this._waveforms.push({
                start: _this.length,
                end: _this.length + waveform.adapter.length,
                waveform: waveform,
            });
            _this.length += waveform.adapter.length;
            _this.duration += waveform.duration;
            _this.pixelsPerSecond = Math.min(_this.pixelsPerSecond, waveform.pixels_per_second);
            _this.secondsPerPixel = Math.min(_this.secondsPerPixel, waveform.seconds_per_pixel);
        });
    }
    // Note: these could be optimised, assuming access is sequential
    CompositeWaveform.prototype.min = function (index) {
        if (typeof this.minIndex[index] === 'undefined') {
            var waveform = this._find(index);
            this.minIndex[index] = waveform ? waveform.waveform.min_sample(index - waveform.start) : 0;
        }
        return this.minIndex[index];
    };
    CompositeWaveform.prototype.max = function (index) {
        if (typeof this.maxIndex[index] === 'undefined') {
            var waveform = this._find(index);
            this.maxIndex[index] = waveform ? waveform.waveform.max_sample(index - waveform.start) : 0;
        }
        return this.maxIndex[index];
    };
    CompositeWaveform.prototype._find = function (index) {
        if (typeof this.timeIndex[index] === 'undefined') {
            var waveform = this._waveforms.find(function (waveform) {
                return index >= waveform.start && index < waveform.end;
            });
            if (!waveform) {
                return null;
            }
            this.timeIndex[index] = waveform;
        }
        return this.timeIndex[index];
    };
    return CompositeWaveform;
}());
exports.CompositeWaveform = CompositeWaveform;
//# sourceMappingURL=composite-waveform.js.map