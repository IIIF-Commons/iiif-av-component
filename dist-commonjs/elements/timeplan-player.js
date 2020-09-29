"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var TimePlanPlayer = /** @class */ (function () {
    function TimePlanPlayer(media, plan, notifyRangeChange, notifyTimeChange, notifyPlaying) {
        var _this = this;
        this.continuous = true;
        this.playing = false;
        this._time = 0;
        this.media = media;
        this.plan = plan;
        this.fullPlan = plan;
        this.currentStop = plan.stops[0];
        this.notifyRangeChange = notifyRangeChange;
        this.notifyTimeChange = notifyTimeChange;
        this.notifyPlaying = notifyPlaying;
        this.logging = true;
        this.currentRange = this.currentStop.rangeStack[0];
        this.setTime(this.currentStop.start);
        media.onPlay(function (canvasId, time, el) {
            // Playing the right thing...
            if (canvasId === _this.plan.canvases[_this.currentStop.canvasIndex]) {
                if (!_this.playing) {
                    _this.notifyPlaying(true);
                }
            }
            else {
                el.pause();
            }
        });
        media.onPause(function (canvasId) {
            if (canvasId === _this.plan.canvases[_this.currentStop.canvasIndex]) {
                if (_this.playing) {
                    _this.notifyPlaying(false);
                }
            }
        });
    }
    TimePlanPlayer.prototype.selectPlan = function (_a) {
        var _b = _a === void 0 ? {} : _a, reset = _b.reset, rangeId = _b.rangeId;
        if (reset) {
            return this.initialisePlan(this.fullPlan);
        }
        if (rangeId) {
            var foundStack = [];
            for (var _i = 0, _c = this.fullPlan.stops; _i < _c.length; _i++) {
                var plan_1 = _c[_i];
                var idx = plan_1.rangeStack.indexOf(rangeId);
                if (plan_1.rangeStack.indexOf(rangeId) !== -1) {
                    foundStack = plan_1.rangeStack.slice(1, idx + 1);
                }
            }
            var plan = this.fullPlan;
            for (var _d = 0, foundStack_1 = foundStack; _d < foundStack_1.length; _d++) {
                var id = foundStack_1[_d];
                for (var _e = 0, _f = plan.items; _e < _f.length; _e++) {
                    var item = _f[_e];
                    if (item.type === 'time-plan' && item.rangeId === id) {
                        plan = item;
                        break;
                    }
                }
            }
            if (plan) {
                return this.initialisePlan(plan);
            }
        }
    };
    TimePlanPlayer.prototype.initialisePlan = function (plan) {
        this.plan = plan;
    };
    TimePlanPlayer.prototype.getCurrentRange = function () {
        var rangeId = this.currentRange;
        var isRangeWithStop = this.currentRange === this.currentStop.rangeId;
        var stopsToCheck = isRangeWithStop ? this.plan.stops : this.fullPlan.stops;
        var starting = [];
        var ending = [];
        for (var _i = 0, stopsToCheck_1 = stopsToCheck; _i < stopsToCheck_1.length; _i++) {
            var stop_1 = stopsToCheck_1[_i];
            if (!isRangeWithStop) {
                if (stop_1.rangeStack.indexOf(rangeId) !== -1) {
                    starting.push(stop_1.start);
                    ending.push(stop_1.end);
                }
            }
            else if (stop_1.rangeId === rangeId) {
                starting.push(stop_1.start);
                ending.push(stop_1.end);
            }
        }
        var start = Math.min.apply(Math, starting);
        var end = Math.max.apply(Math, ending);
        console.log('Range', {
            rangeId: rangeId,
            isRangeWithStop: isRangeWithStop,
            stopsToCheck: stopsToCheck,
            start: start - this.plan.start,
            end: end - this.plan.start,
            duration: end - start,
        });
        return {
            start: start - this.plan.start,
            end: end - this.plan.start,
            duration: end - start,
        };
    };
    TimePlanPlayer.prototype.getTime = function () {
        return this._time;
    };
    TimePlanPlayer.prototype.setInternalTime = function (time) {
        this._time = time;
        this.notifyTimeChange(time);
        return this._time;
    };
    TimePlanPlayer.prototype.log = function () {
        var content = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            content[_i] = arguments[_i];
        }
        if (this.logging) {
            console.log.apply(console, __spreadArrays(['TimePlanPlayer'], content));
        }
    };
    TimePlanPlayer.prototype.setContinuousPlayback = function (continuous) {
        this.continuous = continuous;
    };
    TimePlanPlayer.prototype.setIsPlaying = function (playing) {
        this.playing = playing;
    };
    TimePlanPlayer.prototype.play = function () {
        this.log('Play', this.getTime());
        this.setIsPlaying(true);
        this.media.play(this.plan.canvases[this.currentStop.canvasIndex], this.currentMediaTime());
        return this.getTime();
    };
    TimePlanPlayer.prototype.currentMediaTime = function () {
        return this.getTime() - this.currentStop.start + this.currentStop.canvasTime.start;
    };
    TimePlanPlayer.prototype.pause = function () {
        this.log('Pause', this.getTime());
        this.setIsPlaying(false);
        this.media.pause();
        return this.getTime();
    };
    TimePlanPlayer.prototype.setVolume = function (volume) {
        this.media.setVolume(volume);
    };
    TimePlanPlayer.prototype.findStop = function (time) {
        // // First check current stop.
        // if ((this.currentStop.start - 0.0001) <= time && (this.currentStop.end + 0.0001) > time) {
        //     return this.currentStop;
        // }
        //
        // // Then check next stop.
        // const idx = this.plan.stops.indexOf(this.currentStop);
        // const nextStop = idx !== -1 ? this.plan.stops[idx + 1] : undefined;
        // if (nextStop && nextStop.start <= time && nextStop.end > time) {
        //     return nextStop;
        // }
        // Fallback to checking all stops.
        for (var _i = 0, _a = this.plan.stops; _i < _a.length; _i++) {
            var stop_2 = _a[_i];
            if (stop_2.start - 0.001 <= time && stop_2.end - 0.001 > time) {
                return stop_2;
            }
        }
        if (this.plan.stops[this.plan.stops.length - 1].end === time) {
            return this.plan.stops[this.plan.stops.length - 1];
        }
        return;
    };
    // Time that is set by the user.
    TimePlanPlayer.prototype.setTime = function (time, setRange) {
        if (setRange === void 0) { setRange = true; }
        return __awaiter(this, void 0, void 0, function () {
            var stop;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.groupCollapsed('set time');
                        console.trace();
                        console.log('USER SET TIME', time, setRange);
                        this.log('set time', { from: this.getTime(), to: time });
                        this.setInternalTime(time);
                        stop = this.findStop(time);
                        if (!(stop && stop !== this.currentStop)) return [3 /*break*/, 2];
                        if (setRange) {
                            this.currentRange = stop.rangeId;
                        }
                        return [4 /*yield*/, this.advanceToStop(this.currentStop, stop)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        console.groupEnd();
                        return [2 /*return*/];
                }
            });
        });
    };
    TimePlanPlayer.prototype.next = function () {
        var currentRangeIndex = this.plan.rangeOrder.indexOf(this.currentRange);
        var isLast = currentRangeIndex >= 0 && currentRangeIndex === this.plan.rangeOrder.length - 1;
        var nextRangeIdx = !isLast ? this.plan.rangeOrder.indexOf(this.currentRange) + 1 : undefined;
        var nextRange = typeof nextRangeIdx !== 'undefined' ? this.plan.rangeOrder[nextRangeIdx] : undefined;
        var idx = this.plan.stops.indexOf(this.currentStop);
        var offset = 0;
        var nextStop = undefined;
        var running = true;
        while (running) {
            offset++;
            nextStop = this.plan.stops[idx + offset];
            if (!nextStop) {
                running = false;
                break;
            }
            if (nextStop.rangeId !== this.currentStop.rangeId) {
                running = false;
                break;
            }
        }
        if (this.playing && nextStop) {
            nextRange = nextStop.rangeId;
        }
        if (nextRange && nextStop && nextStop.rangeId !== nextRange) {
            if (this.playing ||
                (this.currentStop.rangeStack.indexOf(nextRange) === -1 && nextStop.rangeStack.indexOf(nextRange) !== -1)) {
                this.currentRange = this.playing ? nextStop.rangeId : nextRange;
                this.setInternalTime(nextStop.start);
                this.advanceToStop(this.currentStop, nextStop, this.playing ? nextStop.rangeId : nextRange);
            }
            else {
                this.currentRange = nextRange;
                this.setInternalTime(this.currentStop.start);
                this.advanceToStop(this.currentStop, this.currentStop, nextRange);
            }
            return this.getTime();
        }
        if (nextStop) {
            this.setInternalTime(nextStop.start);
            this.currentRange = nextStop.rangeId;
            this.advanceToStop(this.currentStop, nextStop, nextStop.rangeId);
        }
        else {
            this.setInternalTime(this.currentStop.end);
        }
        return this.getTime();
    };
    TimePlanPlayer.prototype.previous = function () {
        var currentRangeIndex = this.plan.rangeOrder.indexOf(this.currentRange);
        var isFirst = currentRangeIndex === 0;
        var prevRangeIdx = !isFirst ? this.plan.rangeOrder.indexOf(this.currentRange) - 1 : undefined;
        var prevRange = typeof prevRangeIdx !== 'undefined' ? this.plan.rangeOrder[prevRangeIdx] : undefined;
        var idx = this.plan.stops.indexOf(this.currentStop);
        var prevStop = this.plan.stops[idx - 1];
        var negativeOffset = -1;
        var running = true;
        while (running) {
            var nextPrevStop = this.plan.stops[idx + negativeOffset];
            negativeOffset--; // start at -1
            if (!nextPrevStop) {
                running = false;
                break;
            }
            if (prevStop.rangeId !== nextPrevStop.rangeId) {
                running = false;
                break;
            }
            prevStop = nextPrevStop;
        }
        if (this.playing && prevStop) {
            prevRange = prevStop.rangeId;
        }
        // while (offset <= idx) {
        //     let next = this.plan.stops[offset];
        //     if (!prevStop) {
        //         break;
        //     }
        //     if (next.rangeId === this.currentStop.rangeId) {
        //         break;
        //     }
        //     prevStop = next;
        //     offset++;
        // }
        // Case 1, at the start, but parent ranges possible.
        if (idx === 0) {
            // Set the time to the start.
            this.setInternalTime(this.currentStop.start);
            // We are on the first item.
            if (prevRange && this.currentStop.rangeId !== prevRange) {
                // But we still want to change the range.
                this.currentRange = prevRange;
                this.advanceToStop(this.currentStop, this.currentStop, prevRange);
            }
            // And return the time.
            return this.getTime();
        }
        // Case 2, in the middle, but previous is a parent.
        if (
        // If the range to navigate to isn't part of the current stop.
        prevRange &&
            this.currentStop.rangeStack.indexOf(prevRange) === -1 &&
            // But it is in the previous.
            (prevStop.rangeStack.indexOf(prevRange) !== -1 || prevStop.rangeId === prevRange)) {
            // Then we navigate to the previous.
            this.setInternalTime(prevStop.start);
            this.currentRange = prevRange;
            this.advanceToStop(this.currentStop, prevStop, prevRange);
            // And time.
            return this.getTime();
        }
        // If the previous range is in the current ranges stack (i.e. a parent)
        if (prevRange && this.currentStop.rangeStack.indexOf(prevRange) !== -1) {
            this.setInternalTime(this.currentStop.start);
            this.currentRange = prevRange;
            this.advanceToStop(this.currentStop, this.currentStop, prevRange);
            // And time.
            return this.getTime();
        }
        return this.getTime();
    };
    TimePlanPlayer.prototype.setRange = function (id) {
        console.log('setRange', id);
        if (id === this.currentRange) {
            return this.getTime();
        }
        this.currentRange = id;
        if (id === this.currentStop.rangeId) {
            // Or the start of the range?
            return this.getTime();
        }
        for (var _i = 0, _a = this.plan.stops; _i < _a.length; _i++) {
            var stop_3 = _a[_i];
            if (stop_3.rangeId === id) {
                this.setInternalTime(stop_3.start);
                this.advanceToStop(this.currentStop, stop_3, id);
                break;
            }
        }
        for (var _b = 0, _c = this.plan.stops; _b < _c.length; _b++) {
            var stop_4 = _c[_b];
            if (stop_4.rangeStack.indexOf(id) !== -1) {
                this.setInternalTime(stop_4.start);
                this.advanceToStop(this.currentStop, stop_4, id);
                break;
            }
        }
        return this.getTime();
    };
    TimePlanPlayer.prototype.isBuffering = function () {
        return this.media.isBuffering();
    };
    // Time that has ticked over.
    TimePlanPlayer.prototype.advanceToTime = function (time) {
        // this.log('advanceToTime', this.getTime().toFixed(0), time.toFixed(0));
        var stop = this.findStop(time);
        if (stop && this.currentStop !== stop) {
            this.advanceToStop(this.currentStop, stop);
            return { buffering: this.isBuffering(), time: time };
        }
        // User has selected top level range.
        if (this.playing && this.currentRange !== this.currentStop.rangeId) {
            this.currentRange = this.currentStop.rangeId;
            console.log('Breaking here?');
            this.notifyRangeChange(this.currentStop.rangeId, {
                from: this.currentStop,
                to: this.currentStop,
            });
        }
        if (!stop) {
            this.pause();
            this.setTime(this.currentStop.end);
            return {
                paused: true,
                buffering: this.isBuffering(),
                time: this.currentStop.end,
            };
        }
        else {
            this.setInternalTime(time);
            this.media.syncClock(this.currentMediaTime());
            return { time: time };
        }
    };
    TimePlanPlayer.prototype.hasEnded = function () {
        return this.currentStop.end === this.getTime();
    };
    TimePlanPlayer.prototype.advanceToStop = function (from, to, rangeId) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (from === to) {
                            if (rangeId) {
                                this.notifyRangeChange(rangeId ? rangeId : to.rangeId, {
                                    to: to,
                                    from: from,
                                });
                            }
                            return [2 /*return*/];
                        }
                        this.log('advanceToStop', to.start);
                        this.currentStop = to;
                        promise = this.media.seekTo(this.plan.canvases[to.canvasIndex], this.currentMediaTime());
                        this.notifyRangeChange(rangeId ? rangeId : to.rangeId, { to: to, from: from });
                        return [4 /*yield*/, promise];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TimePlanPlayer.prototype.getStartTime = function () {
        return this.plan.start;
    };
    TimePlanPlayer.prototype.getDuration = function () {
        return this.plan.duration;
    };
    return TimePlanPlayer;
}());
exports.TimePlanPlayer = TimePlanPlayer;
//# sourceMappingURL=timeplan-player.js.map