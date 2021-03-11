"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var manifesto_js_1 = require("manifesto.js");
var Utils_1 = require("./Utils");
var VirtualCanvas = /** @class */ (function () {
    function VirtualCanvas() {
        this.canvases = [];
        // generate an id
        this.id = Utils_1.AVComponentUtils.getTimestamp();
    }
    VirtualCanvas.prototype.addCanvas = function (canvas) {
        // canvases need to be deep copied including functions
        this.canvases.push(jQuery.extend(true, {}, canvas));
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
                    var t = manifesto_js_1.Utils.getTemporalComponent(target);
                    if (!t) {
                        item.__jsonld.target += '#t=0,' + canvas.getDuration();
                    }
                }
            });
            items.forEach(function (item) {
                var target = item.getTarget();
                if (target) {
                    item.__jsonld.target = Utils_1.AVComponentUtils.retargetTemporalComponent(_this.canvases, target);
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
        return duration;
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
exports.VirtualCanvas = VirtualCanvas;
//# sourceMappingURL=VirtualCanvas.js.map