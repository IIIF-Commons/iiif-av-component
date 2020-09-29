var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
export function createTimePlansFromManifest(manifest, mediaElements) {
    var parseRange = function (range, rangeStack, startDuration) {
        var _a, _b, _c;
        if (rangeStack === void 0) { rangeStack = []; }
        if (startDuration === void 0) { startDuration = 0; }
        var timePlan = {
            type: 'time-plan',
            canvases: [],
            duration: 0,
            items: [],
            stops: [],
            rangeOrder: [range.id],
            end: 0,
            start: startDuration,
            rangeId: range.id,
            rangeStack: rangeStack,
        };
        var runningDuration = startDuration;
        var rangeRanges = __spreadArrays(range.items, range.getCanvasIds());
        for (var canvasIndex = 0; canvasIndex < rangeRanges.length; canvasIndex++) {
            var ro = rangeRanges[canvasIndex];
            if (typeof ro === 'string') {
                var _d = ro.match(/(.*)#t=([0-9.]+),?([0-9.]+)?/) || [undefined, ro, '0', '0'], canvasId = _d[1], start = _d[2], end = _d[3];
                // Skip invalid ranges.
                if (!canvasId || typeof start === 'undefined' || typeof end === 'undefined')
                    continue;
                var canvas = manifest.getSequenceByIndex(0).getCanvasById(canvasId);
                if (canvas === null) {
                    throw new Error('Canvas not found..');
                }
                timePlan.canvases.push(canvas.id);
                var rStart = parseFloat(start || '0');
                var rEnd = parseFloat(end || '0');
                var rDuration = rEnd - rStart;
                runningDuration += rDuration;
                var timeStop = {
                    type: 'time-stop',
                    canvasIndex: canvasIndex,
                    start: runningDuration - rDuration,
                    end: runningDuration,
                    duration: rDuration,
                    rangeId: range.id,
                    rawCanvasSelector: ro,
                    canvasTime: {
                        start: rStart,
                        end: rEnd,
                    },
                    rangeStack: rangeStack,
                };
                timePlan.stops.push(timeStop);
                timePlan.items.push(timeStop);
            }
            else {
                var behavior = ro.getBehavior();
                if (!behavior || behavior !== 'no-nav') {
                    var rangeTimePlan = parseRange(ro, __spreadArrays(rangeStack, [ro.id]), runningDuration);
                    runningDuration += rangeTimePlan.duration;
                    (_a = timePlan.stops).push.apply(_a, rangeTimePlan.stops.map(function (stop) { return (__assign(__assign({}, stop), { canvasIndex: stop.canvasIndex + timePlan.canvases.length })); }));
                    (_b = timePlan.canvases).push.apply(_b, rangeTimePlan.canvases);
                    timePlan.items.push(rangeTimePlan);
                    (_c = timePlan.rangeOrder).push.apply(_c, rangeTimePlan.rangeOrder);
                }
            }
        }
        timePlan.end = runningDuration;
        timePlan.duration = timePlan.end - timePlan.start;
        return timePlan;
    };
    var topLevels = manifest.getTopRanges();
    var plans = [];
    if (!topLevels) {
        topLevels = manifest.getAllRanges();
    }
    if (topLevels.length === 1 && !topLevels[0].id) {
        topLevels = topLevels[0].getRanges();
    }
    for (var _i = 0, topLevels_1 = topLevels; _i < topLevels_1.length; _i++) {
        var range = topLevels_1[_i];
        var subRanges = range.getRanges();
        if (subRanges[0] && range.id === range.getRanges()[0].id) {
            range = range.getRanges()[0];
        }
        var rangeTimePlan = parseRange(range, [range.id]);
        plans.push(rangeTimePlan);
    }
    return plans[0]; // @todo only one top level range.
}
//# sourceMappingURL=create-time-plans-from-manifest.js.map