import { Utils } from 'manifesto.js';
import { getTimestamp } from '../helpers/get-timestamp';
import { retargetTemporalComponent } from '../helpers/retarget-temporal-component';
var VirtualCanvas = /** @class */ (function () {
    function VirtualCanvas() {
        this.canvases = [];
        this.durationMap = {};
        this.totalDuration = 0;
        // generate an id
        this.id = getTimestamp();
    }
    VirtualCanvas.prototype.addCanvas = function (canvas) {
        // canvases need to be deep copied including functions
        this.canvases.push(jQuery.extend(true, {}, canvas));
        var duration = canvas.getDuration() || 0;
        this.totalDuration += duration;
        this.durationMap[canvas.id] = {
            duration: duration,
            runningDuration: this.totalDuration,
        };
    };
    VirtualCanvas.prototype.getContent = function () {
        var _this = this;
        var annotations = [];
        this.canvases.forEach(function (canvas) {
            var items = canvas.getContent();
            // if the annotations have no temporal target, add one so that
            // they specifically target the duration of their canvas
            items.forEach(function (item) {
                var target = item.getTarget();
                if (target) {
                    var t = Utils.getTemporalComponent(target);
                    if (!t) {
                        item.__jsonld.target += '#t=0,' + canvas.getDuration();
                    }
                }
            });
            items.forEach(function (item) {
                var target = item.getTarget();
                if (target) {
                    item.__jsonld.target = retargetTemporalComponent(_this.canvases, target);
                }
            });
            annotations.push.apply(annotations, items);
        });
        return annotations;
    };
    VirtualCanvas.prototype.getDuration = function () {
        var duration = 0;
        this.canvases.forEach(function (canvas) {
            var d = canvas.getDuration();
            if (d) {
                duration += d;
            }
        });
        return Math.floor(duration);
    };
    VirtualCanvas.prototype.getWidth = function () {
        if (this.canvases.length) {
            return this.canvases[0].getWidth();
        }
        return 0;
    };
    VirtualCanvas.prototype.getHeight = function () {
        if (this.canvases.length) {
            return this.canvases[0].getHeight();
        }
        return 0;
    };
    return VirtualCanvas;
}());
export { VirtualCanvas };
//# sourceMappingURL=virtual-canvas.js.map