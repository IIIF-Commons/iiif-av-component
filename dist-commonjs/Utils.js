"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var manifesto_js_1 = require("manifesto.js");
var AVComponentUtils = /** @class */ (function () {
    function AVComponentUtils() {
    }
    AVComponentUtils._compare = function (a, b) {
        var changed = [];
        Object.keys(a).forEach(function (p) {
            if (!Object.is(b[p], a[p])) {
                changed.push(p);
            }
        });
        return changed;
    };
    AVComponentUtils.diff = function (a, b) {
        return Array.from(new Set(AVComponentUtils._compare(a, b).concat(AVComponentUtils._compare(b, a))));
    };
    AVComponentUtils.getSpatialComponent = function (target) {
        var spatial = /xywh=([^&]+)/g.exec(target);
        var xywh = null;
        if (spatial && spatial[1]) {
            xywh = spatial[1].split(",");
        }
        return xywh;
    };
    AVComponentUtils.getFirstTargetedCanvasId = function (range) {
        var canvasId;
        if (range.canvases && range.canvases.length) {
            canvasId = range.canvases[0];
        }
        else {
            var childRanges = range.getRanges();
            if (childRanges.length) {
                return AVComponentUtils.getFirstTargetedCanvasId(childRanges[0]);
            }
        }
        if (canvasId !== undefined) {
            return manifesto_js_1.Utils.normaliseUrl(canvasId);
        }
        return undefined;
    };
    AVComponentUtils.getTimestamp = function () {
        return String(new Date().valueOf());
    };
    AVComponentUtils.retargetTemporalComponent = function (canvases, target) {
        var t = manifesto_js_1.Utils.getTemporalComponent(target);
        if (t) {
            var offset = 0;
            var targetWithoutTemporal = target.substr(0, target.indexOf("#"));
            // loop through canvases adding up their durations until we reach the targeted canvas
            for (var i = 0; i < canvases.length; i++) {
                var canvas = canvases[i];
                if (!canvas.id.includes(targetWithoutTemporal)) {
                    var duration = canvas.getDuration();
                    if (duration) {
                        offset += duration;
                    }
                }
                else {
                    // we've reached the canvas whose target we're adjusting
                    break;
                }
            }
            t[0] = Number(t[0]) + offset;
            t[1] = Number(t[1]) + offset;
            return targetWithoutTemporal + "#t=" + t[0] + "," + t[1];
        }
        return undefined;
    };
    AVComponentUtils.formatTime = function (aNumber) {
        var hours, minutes, seconds, hourValue;
        seconds = Math.ceil(aNumber);
        hours = Math.floor(seconds / (60 * 60));
        hours = hours >= 10 ? hours : "0" + hours;
        minutes = Math.floor((seconds % (60 * 60)) / 60);
        minutes = minutes >= 10 ? minutes : "0" + minutes;
        seconds = Math.floor((seconds % (60 * 60)) % 60);
        seconds = seconds >= 10 ? seconds : "0" + seconds;
        if (hours >= 1) {
            hourValue = hours + ":";
        }
        else {
            hourValue = "";
        }
        return hourValue + minutes + ":" + seconds;
    };
    AVComponentUtils.isIE = function () {
        var ua = window.navigator.userAgent;
        // Test values; Uncomment to check result …
        // IE 10
        // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';
        // IE 11
        // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';
        // Edge 12 (Spartan)
        // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';
        // Edge 13
        // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';
        var msie = ua.indexOf("MSIE ");
        if (msie > 0) {
            // IE 10 or older => return version number
            return parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)), 10);
        }
        var trident = ua.indexOf("Trident/");
        if (trident > 0) {
            // IE 11 => return version number
            var rv = ua.indexOf("rv:");
            return parseInt(ua.substring(rv + 3, ua.indexOf(".", rv)), 10);
        }
        var edge = ua.indexOf("Edge/");
        if (edge > 0) {
            // Edge (IE 12+) => return version number
            return parseInt(ua.substring(edge + 5, ua.indexOf(".", edge)), 10);
        }
        // other browser
        return false;
    };
    AVComponentUtils.isSafari = function () {
        // https://stackoverflow.com/questions/7944460/detect-safari-browser?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
        var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        console.log("isSafari", isSafari);
        return isSafari;
    };
    AVComponentUtils.debounce = function (fn, debounceDuration) {
        // summary:
        //      Returns a debounced function that will make sure the given
        //      function is not triggered too much.
        // fn: Function
        //      Function to debounce.
        // debounceDuration: Number
        //      OPTIONAL. The amount of time in milliseconds for which we
        //      will debounce the function. (defaults to 100ms)
        debounceDuration = debounceDuration || 100;
        return function () {
            if (!fn.debouncing) {
                var args = Array.prototype.slice.apply(arguments);
                fn.lastReturnVal = fn.apply(window, args);
                fn.debouncing = true;
            }
            clearTimeout(fn.debounceTimeout);
            fn.debounceTimeout = setTimeout(function () {
                fn.debouncing = false;
            }, debounceDuration);
            return fn.lastReturnVal;
        };
    };
    AVComponentUtils.normalise = function (num, min, max) {
        return (num - min) / (max - min);
    };
    AVComponentUtils.isHLSFormat = function (format) {
        return this.hlsMimeTypes.includes(format.toString());
    };
    AVComponentUtils.isMpegDashFormat = function (format) {
        return format.toString() === "application/dash+xml";
    };
    AVComponentUtils.canPlayHls = function () {
        var doc = typeof document === "object" && document, videoelem = doc && doc.createElement("video"), isvideosupport = Boolean(videoelem && videoelem.canPlayType);
        return (isvideosupport &&
            this.hlsMimeTypes.some(function (canItPlay) {
                return /maybe|probably/i.test(videoelem.canPlayType(canItPlay));
            }));
    };
    AVComponentUtils.hlsMimeTypes = [
        // Apple santioned
        "application/vnd.apple.mpegurl",
        "vnd.apple.mpegurl",
        // Apple sanctioned for backwards compatibility
        "audio/mpegurl",
        // Very common
        "audio/x-mpegurl",
        // Very common
        "application/x-mpegurl",
        // Included for completeness
        "video/x-mpegurl",
        "video/mpegurl",
        "application/mpegurl"
    ];
    return AVComponentUtils;
}());
exports.AVComponentUtils = AVComponentUtils;
//# sourceMappingURL=Utils.js.map