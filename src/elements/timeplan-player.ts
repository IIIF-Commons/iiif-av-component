import { TimePlan } from '../types/time-plan';
import { CompositeMediaElement } from './composite-media-element';
import { TimeStop } from '../types/time-stop';
import {
  addTime,
  annotationTime,
  AnnotationTime,
  minusTime,
  timelineTime,
  TimelineTime,
} from '../helpers/relative-time';
import { Logger } from '../helpers/logger';

export class TimePlanPlayer {
  plan: TimePlan;
  fullPlan: TimePlan;
  media: CompositeMediaElement;
  currentStop: TimeStop;
  currentRange: string;
  continuous = true;
  playing = false;
  _time: TimelineTime = timelineTime(0);
  notifyRangeChange: (rangeId: string, stops: { from: TimeStop; to: TimeStop }) => void;
  notifyTimeChange: (time: TimelineTime) => void;
  notifyPlaying: (playing: boolean) => void;
  logging: boolean;

  constructor(
    media: CompositeMediaElement,
    plan: TimePlan,
    notifyRangeChange?: (rangeId: string, stops: { from: TimeStop; to: TimeStop }) => void,
    notifyTimeChange?: (time: TimelineTime) => void,
    notifyPlaying?: (playing: boolean) => void
  ) {
    this.media = media;
    this.plan = plan;
    this.fullPlan = plan;
    this.currentStop = plan.stops[0];
    const noop = () => {
      // no-op.
    };
    this.notifyRangeChange = notifyRangeChange || noop;
    this.notifyTimeChange = notifyTimeChange || noop;
    this.notifyPlaying = notifyPlaying || noop;
    this.logging = true;
    this.currentRange = this.currentStop.rangeStack[0];

    this.setTime(this.currentStop.start);

    media.onPlay((canvasId, time, el) => {
      // Playing the right thing...
      if (canvasId === this.plan.canvases[this.currentStop.canvasIndex]) {
        if (!this.playing) {
          this.notifyPlaying(true);
        }
      } else {
        el.pause();
      }
    });

    media.onPause((canvasId) => {
      if (canvasId === this.plan.canvases[this.currentStop.canvasIndex]) {
        if (this.playing) {
          this.notifyPlaying(false);
        }
      }
    });
  }

  selectPlan({ reset, rangeId }: { reset?: boolean; rangeId?: string } = {}) {
    if (reset) {
      return this.initialisePlan(this.fullPlan);
    }
    if (rangeId) {
      let foundStack: string[] = [];
      for (const plan of this.fullPlan.stops) {
        const idx = plan.rangeStack.indexOf(rangeId);
        if (plan.rangeStack.indexOf(rangeId) !== -1) {
          foundStack = plan.rangeStack.slice(1, idx + 1);
        }
      }

      let plan = this.fullPlan;
      for (const id of foundStack) {
        for (const item of plan.items) {
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
  }

  initialisePlan(plan: TimePlan) {
    this.plan = plan;
  }

  getCurrentRange() {
    const rangeId = this.currentRange;
    const isRangeWithStop = this.currentRange === this.currentStop.rangeId;
    const stopsToCheck = isRangeWithStop ? this.plan.stops : this.fullPlan.stops;
    const starting: number[] = [];
    const ending: number[] = [];
    for (const stop of stopsToCheck) {
      if (!isRangeWithStop) {
        if (stop.rangeStack.indexOf(rangeId) !== -1) {
          starting.push(stop.start);
          ending.push(stop.end);
        }
      } else if (stop.rangeId === rangeId) {
        starting.push(stop.start);
        ending.push(stop.end);
      }
    }
    const start = Math.min(...starting);
    const end = Math.max(...ending);

    Logger.log('Range', {
      rangeId,
      isRangeWithStop,
      stopsToCheck,
      start: start - this.plan.start,
      end: end - this.plan.start,
      duration: end - start,
    });

    return {
      start: start - this.plan.start,
      end: end - this.plan.start,
      duration: end - start,
    };
  }

  getTime(): TimelineTime {
    return this._time;
  }

  setInternalTime(time: TimelineTime): TimelineTime {
    this._time = time;
    this.notifyTimeChange(time);
    return this._time;
  }

  log(...content: any[]) {
    if (this.logging) {
      Logger.log('TimePlanPlayer', ...content);
    }
  }

  setContinuousPlayback(continuous: boolean) {
    this.continuous = continuous;
  }

  setIsPlaying(playing: boolean) {
    this.playing = playing;
  }

  play(): TimelineTime {
    this.log('Play', this.getTime());
    this.setIsPlaying(true);
    this.media.play(this.plan.canvases[this.currentStop.canvasIndex]);

    return this.getTime();
  }

  currentTimelineTime(): TimelineTime {
    return this.getTime();
  }

  currentMediaTime(): AnnotationTime {
    Logger.log(
      `Current media time:
  - Current start: ${this.currentStop.start}
  - Current canvas: ${this.currentStop.canvasTime.start}
  - Current time: ${this.getTime()}
    `,
      this
    );

    const time = minusTime(this.getTime(), this.currentStop.start);
    return annotationTime(addTime(time, timelineTime(this.currentStop.canvasTime.start)));
  }

  pause(): TimelineTime {
    this.log('Pause', this.getTime());
    this.setIsPlaying(false);
    this.media.pause();

    return this.getTime();
  }

  setVolume(volume: number) {
    this.media.setVolume(volume);
  }

  findStop(time: number) {
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
    for (const stop of this.plan.stops) {
      if (stop.start - 0.001 <= time && stop.end - 0.001 > time) {
        return stop;
      }
    }

    if (this.plan.stops[this.plan.stops.length - 1].end === time) {
      return this.plan.stops[this.plan.stops.length - 1];
    }

    return;
  }

  // Time that is set by the user.
  async setTime(time: TimelineTime, setRange = true) {
    Logger.groupCollapsed(`TimeplanPlayer.setTime(${time}, ${setRange ? 'true' : 'false'})`);

    // Early exit?
    const start = this.getTime();
    if (start !== time) {
      this.log('set time', { from: this.getTime(), to: time });
      this.setInternalTime(time);

      const stop = this.findStop(time);
      if (stop && stop !== this.currentStop) {
        if (setRange) {
          this.currentRange = stop.rangeId;
        }
        await this.advanceToStop(this.currentStop, stop);
      }
    }
    Logger.groupEnd();
  }

  next(): TimelineTime {
    const currentRangeIndex = this.plan.rangeOrder.indexOf(this.currentRange);
    const isLast = currentRangeIndex >= 0 && currentRangeIndex === this.plan.rangeOrder.length - 1;
    const nextRangeIdx = !isLast ? this.plan.rangeOrder.indexOf(this.currentRange) + 1 : undefined;
    let nextRange = typeof nextRangeIdx !== 'undefined' ? this.plan.rangeOrder[nextRangeIdx] : undefined;

    const idx = this.plan.stops.indexOf(this.currentStop);
    let offset = 0;
    let nextStop: undefined | TimeStop = undefined;
    let running = true;
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
      if (
        this.playing ||
        (this.currentStop.rangeStack.indexOf(nextRange) === -1 && nextStop.rangeStack.indexOf(nextRange) !== -1)
      ) {
        this.currentRange = this.playing ? nextStop.rangeId : nextRange;
        this.setInternalTime(nextStop.start);
        this.advanceToStop(this.currentStop, nextStop, this.playing ? nextStop.rangeId : nextRange);
      } else {
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
    } else {
      this.goToEndOfRange(this.currentStop.rangeId);
    }

    return this.getTime();
  }

  goToEndOfRange(rangeId: string) {
    let state: TimeStop | undefined = undefined;

    for (let i = 0; i < this.plan.stops.length; i++) {
      const stop = this.plan.stops[i];
      if (stop.rangeId === rangeId && (!state || (stop.canvasIndex >= state.canvasIndex && stop.end > state.end))) {
        state = stop;
      }
    }

    if (state) {
      this.advanceToStop(this.currentStop, state, rangeId);
      this.setInternalTime(state.end);
    }
  }
  goToStartOfRange(rangeId: string) {
    let state: TimeStop | undefined = undefined;
    const length = this.plan.stops.length;
    for (let i = length - 1; i >= 0; i--) {
      const stop = this.plan.stops[i];
      if (stop.rangeId === rangeId && (!state || (stop.canvasIndex <= state.canvasIndex && stop.start < state.start))) {
        state = stop;
      }
    }

    if (state) {
      if (state !== this.currentStop) {
        this.advanceToStop(this.currentStop, state, rangeId);
      }
      this.setInternalTime(state.start);
    }
  }

  previous(): TimelineTime {
    const currentRangeIndex = this.plan.rangeOrder.indexOf(this.currentRange);
    const isFirst = currentRangeIndex === 0;
    const prevRangeIdx = !isFirst ? this.plan.rangeOrder.indexOf(this.currentRange) - 1 : undefined;
    let prevRange = typeof prevRangeIdx !== 'undefined' ? this.plan.rangeOrder[prevRangeIdx] : undefined;
    let currentStopHead = this.currentStop;
    const idx = this.plan.stops.indexOf(this.currentStop);
    let newIdx = idx;
    let prevStop = this.plan.stops[idx - 1];
    let running = true;
    while (running) {
      const nextPrevStop = this.plan.stops[newIdx - 1];
      if (!nextPrevStop) {
        running = false;
        break;
      }
      if (nextPrevStop.rangeId === this.currentRange) {
        currentStopHead = nextPrevStop;
      }
      if (prevStop.rangeId !== nextPrevStop.rangeId) {
        running = false;
        break;
      }

      if (nextPrevStop) {
        prevStop = nextPrevStop;
        newIdx = newIdx - 1;
      }
    }

    const goBackToStartOfRange = this._time - (currentStopHead.start + 2) > 0;
    const isPreviousRangeDifferent = this.playing && prevStop && prevStop.rangeId !== this.currentStop.rangeId;
    const isDefinitelyFirstRange = idx === 0 || (!prevRange && newIdx === 0);
    const isPreviousRangeNotAParent =
      prevRange &&
      this.currentStop.rangeStack.indexOf(prevRange) === -1 &&
      // But it is in the previous.
      (prevStop.rangeStack.indexOf(prevRange) !== -1 || prevStop.rangeId === prevRange);
    const isPreviousRangeInStack = prevRange && this.currentStop.rangeStack.indexOf(prevRange) !== -1;


    if (goBackToStartOfRange) {
      if (currentStopHead !== this.currentStop) {
        this.advanceToStop(this.currentStop, currentStopHead, currentStopHead.rangeId);
      }
      this.setInternalTime(currentStopHead.start);

      return this.getTime();
    }

    if (isPreviousRangeDifferent) {
      prevRange = prevStop.rangeId;
    }

    // Case 1, at the start, but parent ranges possible.
    if (isDefinitelyFirstRange) {
      // Set the time to the start.
      this.goToStartOfRange(prevRange ? prevRange : this.currentStop.rangeId);
      // We are on the first item.
      if (prevRange && this.currentStop.rangeId !== prevRange) {
        // But we still want to change the range.
        this.currentRange = prevRange;
        this.advanceToStop(this.currentStop, currentStopHead, prevRange);
      }

      // And return the time.
      return this.getTime();
    }

    // Case 2, in the middle, but previous is a parent.
    if (prevRange && isPreviousRangeNotAParent) {
      // Then we navigate to the previous.
      this.setInternalTime(prevStop.start);
      this.currentRange = prevRange;
      this.advanceToStop(this.currentStop, prevStop, prevRange);
      // And time.
      return this.getTime();
    }

    // If the previous range is in the current ranges stack (i.e. a parent)
    if (prevRange && isPreviousRangeInStack) {
      this.setInternalTime(this.currentStop.start);
      this.currentRange = prevRange;
      this.advanceToStop(this.currentStop, currentStopHead, prevRange);
      // And time.
      return this.getTime();
    }

    return this.getTime();
  }

  setRange(id: string): TimelineTime {
    Logger.log('setRange', id);

    if (id === this.currentRange) {
      return this.getTime();
    }

    this.currentRange = id;

    if (id === this.currentStop.rangeId) {
      // Or the start of the range?
      return this.getTime();
    }

    for (const stop of this.plan.stops) {
      if (stop.rangeId === id) {
        this.setInternalTime(stop.start);
        this.advanceToStop(this.currentStop, stop, id);
        break;
      }
    }
    for (const stop of this.plan.stops) {
      if (stop.rangeStack.indexOf(id) !== -1) {
        this.setInternalTime(stop.start);
        this.advanceToStop(this.currentStop, stop, id);
        break;
      }
    }

    return this.getTime();
  }

  isBuffering() {
    return this.media.isBuffering();
  }

  // Time that has ticked over.
  advanceToTime(time: TimelineTime): {
    paused?: boolean;
    buffering?: boolean;
    time: TimelineTime | undefined;
  } {
    Logger.groupCollapsed(`TimeplanPlayer.advanceToTime(${time})`);

    // this.log('advanceToTime', this.getTime().toFixed(0), time.toFixed(0));

    const stop = this.findStop(time);
    if (stop && this.currentStop !== stop) {
      Logger.log('advanceToTime.a');

      this.advanceToStop(this.currentStop, stop);
      return { buffering: this.isBuffering(), time };
    }
    // User has selected top level range.
    if (this.playing && this.currentRange !== this.currentStop.rangeId) {
      this.currentRange = this.currentStop.rangeId;
      this.notifyRangeChange(this.currentStop.rangeId, {
        from: this.currentStop,
        to: this.currentStop,
      });
    }

    if (!stop) {
      Logger.log('advanceToTime.b');

      this.pause();
      this.setTime(this.currentStop.end);
      Logger.groupEnd();
      return {
        paused: true,
        buffering: this.isBuffering(),
        time: this.currentStop.end,
      };
    } else {
      Logger.log('advanceToTime.c', {
        time: this.getTime(),
      });

      this.setInternalTime(time);
      this.media.syncClock(this.currentMediaTime());
      Logger.groupEnd();
      return { time };
    }
  }

  hasEnded() {
    return this.currentStop.end === this.getTime();
  }

  async advanceToStop(from: TimeStop, to: TimeStop, rangeId?: string) {
    Logger.log('TimeplanPlayer.advanceToStop', {
      from,
      to,
      rangeId,
    });
    if (from === to) {
      if (rangeId) {
        this.notifyRangeChange(rangeId ? rangeId : to.rangeId, {
          to,
          from,
        });
      }
      return;
    }
    this.log('advanceToStop', to.start);
    this.currentStop = to;

    const promise = this.media.seekToMediaTime(this.currentMediaTime());

    this.notifyRangeChange(rangeId ? rangeId : to.rangeId, { to, from });

    await promise;
  }

  getStartTime(): TimelineTime {
    return this.plan.start;
  }

  getDuration(): TimelineTime {
    return this.plan.duration;
  }
}
