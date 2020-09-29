import * as Manifesto from 'manifesto.js';
import * as Manifold from '@iiif/manifold';
import { Behavior, MediaType } from '@iiif/vocabulary';


  export type TimeStop = {
    type: "time-stop";
    canvasIndex: number;
    start: number;
    end: number;
    duration: number;
    rangeId: string;
    rawCanvasSelector: string;
    rangeStack: string[];
    canvasTime: {
      start: number;
      end: number;
    };
  };

  export type TimePlan = {
    type: "time-plan";
    duration: number;
    start: number;
    end: number;
    stops: TimeStop[];
    rangeId: string;
    canvases: any[];
    rangeStack: string[];
    rangeOrder: string[];
    items: Array<TimeStop | TimePlan>;
  };

  // Helper functions.
  namespace AVHelpers {
    export function createTimePlansFromManifest(
      manifest: Manifesto.Manifest,
      mediaElements: MediaElement[]
    ) {
      const parseRange = (
        range: Manifesto.Range,
        rangeStack: string[] = [],
        startDuration: number = 0
      ): TimePlan => {
        const timePlan: TimePlan = {
          type: "time-plan",
          canvases: [],
          duration: 0,
          items: [],
          stops: [],
          rangeOrder: [range.id],
          end: 0,
          start: startDuration,
          rangeId: range.id,
          rangeStack,
        };

        let runningDuration = startDuration;

        const rangeRanges = [...range.items, ...range.getCanvasIds()];

        for (
          let canvasIndex = 0;
          canvasIndex < rangeRanges.length;
          canvasIndex++
        ) {
          const ro = rangeRanges[canvasIndex];

          if (typeof ro === "string") {
            const [, canvasId, start, end] = ro.match(
              /(.*)#t=([0-9.]+),?([0-9.]+)?/
            ) || [undefined, ro, "0", "0"];

            // Skip invalid ranges.
            if (
              !canvasId ||
              typeof start === "undefined" ||
              typeof end === "undefined"
            )
              continue;

            const canvas = manifest
              .getSequenceByIndex(0)
              .getCanvasById(canvasId);

            if (canvas === null) {
              throw new Error("Canvas not found..");
            }

            timePlan.canvases.push(canvas.id);

            const rStart = parseFloat(start || "0");
            const rEnd = parseFloat(end || "0");
            const rDuration = rEnd - rStart;

            runningDuration += rDuration;

            const timeStop: TimeStop = {
              type: "time-stop",
              canvasIndex,
              start: runningDuration - rDuration,
              end: runningDuration,
              duration: rDuration,
              rangeId: range.id,
              rawCanvasSelector: ro,
              canvasTime: {
                start: rStart,
                end: rEnd,
              },
              rangeStack,
            };

            timePlan.stops.push(timeStop);
            timePlan.items.push(timeStop);
          } else {
            const behavior = (ro as Manifesto.Range).getBehavior();
            if (!behavior || behavior !== 'no-nav') {
              const rangeTimePlan = parseRange(
                ro as any,
                [...rangeStack, ro.id],
                runningDuration
              );

              runningDuration += rangeTimePlan.duration;

              timePlan.stops.push(
                ...rangeTimePlan.stops.map((stop) => ({
                  ...stop,
                  canvasIndex: stop.canvasIndex + timePlan.canvases.length,
                }))
              );
              timePlan.canvases.push(...rangeTimePlan.canvases);
              timePlan.items.push(rangeTimePlan);
              timePlan.rangeOrder.push(...rangeTimePlan.rangeOrder);
            }
          }
        }

        timePlan.end = runningDuration;
        timePlan.duration = timePlan.end - timePlan.start;

        return timePlan;
      };

      let topLevels = manifest.getTopRanges();
      const plans: TimePlan[] = [];

      if (!topLevels) {
        topLevels = manifest.getAllRanges();
      }

      if (topLevels.length === 1 && !topLevels[0].id) {
        topLevels = topLevels[0].getRanges();
      }

      for (let range of topLevels) {
        const subRanges = range.getRanges();
        if (subRanges[0] && range.id === range.getRanges()[0].id) {
          range = range.getRanges()[0];
        }

        const rangeTimePlan = parseRange(range as Manifesto.Range, [range.id]);
        plans.push(rangeTimePlan);
      }

      return plans[0]; // @todo only one top level range.
    }

    export function extractMediaFromAnnotationBodies(
      annotation: Manifesto.Annotation
    ) {
      const bodies = annotation.getBody();
      if (!bodies.length) {
        return null;
      }

      // if there's an HLS format and HLS is supported in this browser
      for (let i = 0; i < bodies.length; i++) {
        const body: Manifesto.AnnotationBody = bodies[i];
        const format: MediaType | null = body.getFormat();

        if (format) {
          if (
            AVComponentUtils.isHLSFormat(format) &&
            AVComponentUtils.canPlayHls()
          ) {
            return body;
          }
        }
      }

      // if there's a Dash format and the browser isn't Safari
      for (let i = 0; i < bodies.length; i++) {
        const body: Manifesto.AnnotationBody = bodies[i];
        const format: MediaType | null = body.getFormat();

        if (format) {
          if (
            AVComponentUtils.isMpegDashFormat(format) &&
            !AVComponentUtils.isSafari()
          ) {
            return body;
          }
        }
      }

      // otherwise, return the first format that isn't HLS or Dash
      for (let i = 0; i < bodies.length; i++) {
        const body: Manifesto.AnnotationBody = bodies[i];
        const format: MediaType | null = body.getFormat();

        if (format) {
          if (
            !AVComponentUtils.isHLSFormat(format) &&
            !AVComponentUtils.isMpegDashFormat(format)
          ) {
            return body;
          }
        }
      }

      // couldn't find a suitable format
      return null;
    }

    interface MediaSource {
      type: string;
      format?: MediaType;
      mediaSource: string;
      canvasId: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      start: number;
      end: number;
      bodyId: string;
      offsetStart?: number;
      offsetEnd?: number;
    }

    export function getMediaSourceFromAnnotationBody(
      annotation: Manifesto.Annotation,
      body: Manifesto.AnnotationBody,
      canvasDimensions: {
        id: string;
        width: number;
        height: number;
        duration: number;
      }
    ): MediaSource {
      const type = body.getType();
      const format = body.getFormat() || undefined;
      const mediaSource = body.id.split("#")[0];
      const target = annotation.getTarget();

      if (!target) {
        throw new Error("No target");
      }

      if (!type) {
        throw new Error("Unknown media type");
      }

      const [x, y, width, height] = AVComponentUtils.getSpatialComponent(
        target
      ) || [0, 0, canvasDimensions.width || 0, canvasDimensions.height || 0];
      const [start, end]: any[] = Manifesto.Utils.getTemporalComponent(
        target
      ) || [0, canvasDimensions.duration];

      const [, bodyId, offsetStart, offsetEnd] = body.id.match(
        /(.*)#t=([0-9.]+),?([0-9.]+)?/
      ) || [undefined, body.id, undefined, undefined];

      return {
        type,
        format,
        mediaSource,
        canvasId: canvasDimensions.id,
        x,
        y,
        width:
          typeof width === "undefined"
            ? undefined
            : parseInt(String(width), 10),
        height:
          typeof height === "undefined"
            ? undefined
            : parseInt(String(height), 10),
        start: Number(Number(start).toFixed(2)),
        end: Number(Number(end).toFixed(2)),
        bodyId: bodyId as string,
        offsetStart:
          typeof offsetStart === "undefined"
            ? undefined
            : parseFloat(offsetStart),
        offsetEnd:
          typeof offsetEnd === "undefined" ? undefined : parseFloat(offsetEnd),
      };
    }

    type MediaOptions = {
      adaptiveAuthEnabled?: boolean;
      mediaSyncMarginSecs?: number;
    };

    export abstract class MediaFormat {
      options: MediaOptions;
      source: string;
      protected constructor(source: string, options: MediaOptions = {}) {
        this.source = source;
        this.options = options;
      }
      attachTo(element: HTMLMediaElement) {
        element.setAttribute("src", this.source);
      }
    }

    export class DashFormat extends MediaFormat {
      player: any;
      constructor(source: string, options: MediaOptions = {}) {
        super(source, options);
        this.player = dashjs.MediaPlayer().create();
        this.player.getDebug().setLogToBrowserConsole(false);
        if (options.adaptiveAuthEnabled) {
          this.player.setXHRWithCredentialsForType("MPD", true); // send cookies
        }
      }
      attachTo(element: HTMLMediaElement) {
        this.player.initialize(element, this.source, false);
      }
      debug() {
        this.player.getDebug().setLogToBrowserConsole(true);
        this.player.getDebug().setLogLevel(4);
      }
    }

    export class HlsFormat extends MediaFormat {
      hls: any;
      constructor(source: string, options: MediaOptions = {}) {
        super(source, options);

        if (options.adaptiveAuthEnabled) {
          this.hls = new Hls({
            xhrSetup: (xhr: any) => {
              xhr.withCredentials = true; // send cookies
            },
          });
        } else {
          this.hls = new Hls();
        }
        this.hls.loadSource(this.source);
      }
      attachTo(element: HTMLMediaElement) {
        this.hls.attachMedia(element);
      }
    }

    export class MpegFormat extends MediaFormat {
      constructor(source: string, options: MediaOptions = {}) {
        super(source, options);
      }
      attachTo(element: HTMLMediaElement) {
        element.src = this.source;
      }
    }

    export class DefaultFormat extends MediaFormat {
      constructor(source: string, options: MediaOptions = {}) {
        super(source, options);
      }
    }

    export class MediaElement {
      type: string;
      format?: string;
      mediaSource: string;
      source: MediaSource;
      element: HTMLMediaElement;
      instance: MediaFormat;
      mediaSyncMarginSecs: number;
      constructor(source: MediaSource, mediaOptions: MediaOptions = {}) {
        this.source = source;
        this.mediaSource = source.mediaSource;
        this.type = source.type.toString().toLowerCase();
        this.format = source.format ? source.format.toString() : undefined;
        this.mediaSyncMarginSecs = mediaOptions.mediaSyncMarginSecs || 1;

        switch (this.type) {
          case "video":
            this.element = document.createElement("video");
            break;

          case "sound":
          case "audio":
            this.element = document.createElement("audio");
            break;
          default:
            return;
        }

        if (this.isDash()) {
          this.instance = new DashFormat(this.mediaSource, mediaOptions);
        } else if (this.isHls()) {
          this.instance = new HlsFormat(this.mediaSource, mediaOptions);
        } else if (this.isMpeg()) {
          this.instance = new MpegFormat(this.mediaSource, mediaOptions);
        } else {
          this.instance = new DefaultFormat(this.mediaSource, mediaOptions);
        }
        this.element.classList.add("anno");
        this.element.crossOrigin = "anonymous";
        this.element.preload = "metadata";
        this.element.pause();

        this.instance.attachTo(this.element);
        this.element.currentTime = this.source.start;
      }

      syncClock(time: number) {
        if (
          Math.abs(this.element.currentTime - time) > this.mediaSyncMarginSecs
        ) {
          this.element.currentTime = time;
        }
      }

      getCanvasId() {
        return this.source.canvasId;
      }

      isWithinRange(time: number) {
        return this.source.start <= time && this.source.end >= time;
      }

      async load(withAudio: boolean = false): Promise<void> {
        if (withAudio) {
          this.element.load();
        }
        await new Promise((resolve) => {
          this.element.addEventListener("loadedmetadata", () => {
            resolve();
          });
        });
      }

      setSize(top: number, left: number, width: number, height: number) {
        $(this.element).css({
          top: `${top}%`,
          left: `${left}%`,
          width: `${width}%`,
          height: `${height}%`,
        });
      }

      isDash() {
        return this.format && this.format.toString() === "application/dash+xml";
      }

      isHls() {
        return (
          this.format &&
          this.format.toString() === "application/vnd.apple.mpegurl" &&
          Hls &&
          Hls.isSupported()
        );
      }

      isMpeg(): boolean {
        return this.element.canPlayType("application/vnd.apple.mpegurl") !== "";
      }

      stop() {
        this.element.pause();
        this.element.currentTime = this.source.start;
      }

      play(time?: number): Promise<void> {
        if (time) {
          this.element.currentTime = time;
        }
        return this.element.play();
      }

      pause() {
        this.element.pause();
      }

      isBuffering() {
        return this.element.readyState < 3;
      }
    }

    export class CompositeMediaElement {
      elements: MediaElement[] = [];

      activeElement: MediaElement;
      playing: boolean = false;

      canvasMap: {
        [id: string]: MediaElement[];
      } = {};

      private _onPlay: Function[] = [];
      private _onPause: Function[] = [];

      constructor(mediaElements: MediaElement[]) {
        // Add all elements.
        this.elements = mediaElements;
        for (const el of mediaElements) {
          const canvasId = el.getCanvasId();
          this.canvasMap[canvasId] = this.canvasMap[canvasId]
            ? this.canvasMap[canvasId]
            : [];
          this.canvasMap[canvasId].push(el);
          // Attach events.
          el.element.addEventListener("play", () => {
            this._onPlay.forEach((fn) =>
              fn(canvasId, el.element.currentTime, el)
            );
          });
          el.element.addEventListener("pause", () => {
            this._onPause.forEach((fn) =>
              fn(canvasId, el.element.currentTime, el)
            );
          });
        }
        this.activeElement = mediaElements[0];
      }

      syncClock(time: number) {
        this.activeElement.syncClock(time);
      }

      onPlay(
        func: (canvasId: string, time: number, el: HTMLMediaElement) => void
      ) {
        this._onPlay.push(func);
      }

      onPause(
        func: (canvasId: string, time: number, el: HTMLMediaElement) => void
      ) {
        this._onPause.push(func);
      }

      findElementInRange(canvasId: string, time: number) {
        if (!this.canvasMap[canvasId]) {
          return undefined;
        }
        for (const el of this.canvasMap[canvasId]) {
          if (el.isWithinRange(time)) {
            return el;
          }
        }
        return undefined;
      }

      appendTo($element: JQuery) {
        console.log(
          "Appending...",
          this.elements.map((media) => media.element)
        );
        $element.append(this.elements.map((media) => media.element));
      }

      async load(): Promise<void> {
        await Promise.all(this.elements.map((element) => element.load()));
      }

      async seekTo(canvasId: string, time: number) {
        const newElement = this.findElementInRange(canvasId, time);
        if (newElement && newElement !== this.activeElement) {
          // Moving track.
          // Stop the current track.
          this.activeElement.stop();

          // Set new current track.
          this.activeElement = newElement;
        }

        if (this.playing) {
          await this.activeElement.play(time);
        } else {
          this.activeElement.syncClock(time);
        }
      }

      async play(canvasId?: string, time?: number) {
        this.playing = true;
        if (canvasId && typeof time !== "undefined") {
          await this.seekTo(canvasId, time);
        }
        return this.activeElement.play(time);
      }

      pause() {
        this.playing = false;
        this.activeElement.pause();
      }

      setVolume(volume: number) {
        for (const el of this.elements) {
          el.element.volume = volume;
        }
      }

      isBuffering() {
        return this.activeElement.isBuffering();
      }
    }

    export class TimePlanPlayer {
      plan: TimePlan;
      fullPlan: TimePlan;
      media: CompositeMediaElement;
      currentStop: TimeStop;
      currentRange: string;
      continuous: boolean = true;
      playing: boolean = false;
      _time: number = 0;
      notifyRangeChange: (
        rangeId: string,
        stops: { from: TimeStop; to: TimeStop }
      ) => void;
      notifyTimeChange: (time: number) => void;
      notifyPlaying: (playing: boolean) => void;
      logging: boolean;

      constructor(
        media: CompositeMediaElement,
        plan: TimePlan,
        notifyRangeChange: (
          rangeId: string,
          stops: { from: TimeStop; to: TimeStop }
        ) => void,
        notifyTimeChange: (time: number) => void,
        notifyPlaying: (playing: boolean) => void
      ) {
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

      selectPlan({
        reset,
        rangeId,
      }: { reset?: boolean; rangeId?: string } = {}) {
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
              if (item.type === "time-plan" && item.rangeId === id) {
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
        const stopsToCheck = isRangeWithStop
          ? this.plan.stops
          : this.fullPlan.stops;
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

        console.log("Range", {
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

      getTime() {
        return this._time;
      }

      setInternalTime(time: number) {
        this._time = time;
        this.notifyTimeChange(time);
        return this._time;
      }

      log(...content: any[]) {
        this.logging && console.log("TimePlanPlayer", ...content);
      }

      setContinuousPlayback(continuous: boolean) {
        this.continuous = continuous;
      }

      setIsPlaying(playing: boolean) {
        this.playing = playing;
      }

      play() {
        this.log("Play", this.getTime());
        this.setIsPlaying(true);
        this.media.play(
          this.plan.canvases[this.currentStop.canvasIndex],
          this.currentMediaTime()
        );

        return this.getTime();
      }

      currentMediaTime() {
        return (
          this.getTime() -
          this.currentStop.start +
          this.currentStop.canvasTime.start
        );
      }

      pause() {
        this.log("Pause", this.getTime());
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
      async setTime(time: number, setRange: boolean = true) {
        console.groupCollapsed("set time");
        console.trace();
        console.log("USER SET TIME", time, setRange);
        this.log("set time", { from: this.getTime(), to: time });
        this.setInternalTime(time);

        const stop = this.findStop(time);
        if (stop && stop !== this.currentStop) {
          if (setRange) {
            this.currentRange = stop.rangeId;
          }
          await this.advanceToStop(this.currentStop, stop);
        }
        console.groupEnd();
      }

      next() {
        const currentRangeIndex = this.plan.rangeOrder.indexOf(
          this.currentRange
        );
        const isLast =
          currentRangeIndex >= 0 &&
          currentRangeIndex === this.plan.rangeOrder.length - 1;
        const nextRangeIdx = !isLast
          ? this.plan.rangeOrder.indexOf(this.currentRange) + 1
          : undefined;
        let nextRange =
          typeof nextRangeIdx !== "undefined"
            ? this.plan.rangeOrder[nextRangeIdx]
            : undefined;

        const idx = this.plan.stops.indexOf(this.currentStop);
        let offset = 0;
        let nextStop: TimeStop;
        while (true) {
          offset++;
          nextStop = this.plan.stops[idx + offset];
          if (!nextStop) {
            break;
          }
          if (nextStop.rangeId !== this.currentStop.rangeId) {
            break;
          }
        }

        if (this.playing && nextStop) {
          nextRange = nextStop.rangeId;
        }

        if (nextRange && nextStop && nextStop.rangeId !== nextRange) {
          if (
            this.playing ||
            (this.currentStop.rangeStack.indexOf(nextRange) === -1 &&
              nextStop.rangeStack.indexOf(nextRange) !== -1)
          ) {
            this.currentRange = this.playing ? nextStop.rangeId : nextRange;
            this.setInternalTime(nextStop.start);
            this.advanceToStop(
              this.currentStop,
              nextStop,
              this.playing ? nextStop.rangeId : nextRange
            );
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
          this.setInternalTime(this.currentStop.end);
        }

        return this.getTime();
      }

      previous() {
        const currentRangeIndex = this.plan.rangeOrder.indexOf(
          this.currentRange
        );
        const isFirst = currentRangeIndex === 0;
        const prevRangeIdx = !isFirst
          ? this.plan.rangeOrder.indexOf(this.currentRange) - 1
          : undefined;
        let prevRange =
          typeof prevRangeIdx !== "undefined"
            ? this.plan.rangeOrder[prevRangeIdx]
            : undefined;

        const idx = this.plan.stops.indexOf(this.currentStop);
        let prevStop = this.plan.stops[idx - 1];
        let negativeOffset = -1;
        while (true) {
          let nextPrevStop = this.plan.stops[idx + negativeOffset];
          negativeOffset--; // start at -1
          if (!nextPrevStop) {
            break;
          }
          if (prevStop.rangeId !== nextPrevStop.rangeId) {
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
          (prevStop.rangeStack.indexOf(prevRange) !== -1 ||
            prevStop.rangeId === prevRange)
        ) {
          // Then we navigate to the previous.
          this.setInternalTime(prevStop.start);
          this.currentRange = prevRange;
          this.advanceToStop(this.currentStop, prevStop, prevRange);
          // And time.
          return this.getTime();
        }

        // If the previous range is in the current ranges stack (i.e. a parent)
        if (
          prevRange &&
          this.currentStop.rangeStack.indexOf(prevRange) !== -1
        ) {
          this.setInternalTime(this.currentStop.start);
          this.currentRange = prevRange;
          this.advanceToStop(this.currentStop, this.currentStop, prevRange);
          // And time.
          return this.getTime();
        }

        return this.getTime();
      }

      setRange(id: string) {
        console.log("setRange", id);

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
      advanceToTime(time: number) {
        // this.log('advanceToTime', this.getTime().toFixed(0), time.toFixed(0));

        const stop = this.findStop(time);
        if (stop && this.currentStop !== stop) {
          this.advanceToStop(this.currentStop, stop);
          return { buffering: this.isBuffering(), time };
        }
        // User has selected top level range.
        if (this.playing && this.currentRange !== this.currentStop.rangeId) {
          this.currentRange = this.currentStop.rangeId;
          console.log("Breaking here?");
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
        } else {
          this.setInternalTime(time);
          this.media.syncClock(this.currentMediaTime());
          return { time };
        }
      }

      hasEnded() {
        return this.currentStop.end === this.getTime();
      }

      async advanceToStop(from: TimeStop, to: TimeStop, rangeId?: string) {
        if (from === to) {
          if (rangeId) {
            this.notifyRangeChange(rangeId ? rangeId : to.rangeId, {
              to,
              from,
            });
          }
          return;
        }
        this.log("advanceToStop", to.start);
        this.currentStop = to;

        const promise = this.media.seekTo(
          this.plan.canvases[to.canvasIndex],
          this.currentMediaTime()
        );

        this.notifyRangeChange(rangeId ? rangeId : to.rangeId, { to, from });

        await promise;
      }

      getStartTime() {
        return this.plan.start;
      }

      getDuration() {
        return this.plan.duration;
      }
    }
  }

  export interface IAVCanvasInstanceData extends IAVComponentData {
    canvas?: Manifesto.Canvas | VirtualCanvas;
    range?: Manifesto.Range;
    visible?: boolean;
    volume?: number;
  }

  export interface IAVComponentContent {
    currentTime: string;
    collapse: string;
    duration: string;
    expand: string;
    mute: string;
    next: string;
    pause: string;
    play: string;
    previous: string;
    unmute: string;
    fastForward: string;
    fastRewind: string;
  }

  export interface IAVComponentData {
    [key: string]: any;
    adaptiveAuthEnabled?: boolean;
    autoPlay?: boolean;
    autoSelectRange?: boolean;
    canvasId?: string;
    constrainNavigationToRange?: boolean;
    content?: IAVComponentContent;
    defaultAspectRatio?: number;
    doubleClickMS?: number;
    helper?: Manifold.Helper;
    halveAtWidth?: number;
    limitToRange?: boolean;
    posterImageRatio?: number;
    rangeId?: string;
    virtualCanvasEnabled?: boolean;
    waveformBarSpacing?: number;
    waveformBarWidth?: number;
    waveformColor?: string;
    enableFastForward?: boolean;
    enableFastRewind?: boolean;
  }

  export interface IAVVolumeControlState {
    volume?: number;
  }

  export interface IMaxMin {
    max: number;
    min: number;
  }

  export class AVVolumeControl extends _Components.BaseComponent {
    private _$volumeSlider: JQuery;
    private _$volumeMute: JQuery;

    private _lastVolume: number = 1;

    private _data: IAVVolumeControlState = {
      volume: 1,
    };

    constructor(options: _Components.IBaseComponentOptions) {
      super(options);

      this._init();
      this._resize();
    }

    protected _init(): boolean {
      const success: boolean = super._init();

      if (!success) {
        console.error("Component failed to initialise");
      }

      this._$volumeMute = $(`
                                <button class="btn volume-mute" title="${this.options.data.content.mute}">
                                    <i class="av-icon av-icon-mute on" aria-hidden="true"></i>${this.options.data.content.mute}
                                </button>`);

      this._$volumeSlider = $('<div class="volume-slider"></div>');

      this._$element.append(this._$volumeMute, this._$volumeSlider);

      const that = this;

      this._$volumeMute.on("touchstart click", (e) => {
        e.preventDefault();

        // start reducer
        if (this._data.volume !== 0) {
          // mute
          this._lastVolume = <number>this._data.volume;
          this._data.volume = 0;
        } else {
          // unmute
          this._data.volume = this._lastVolume;
        }
        // end reducer

        this.fire(VolumeEvents.VOLUME_CHANGED, this._data.volume);
      });

      this._$volumeSlider.slider({
        value: that._data.volume,
        step: 0.1,
        orientation: "horizontal",
        range: "min",
        min: 0,
        max: 1,
        animate: false,
        create: function () {},
        slide: function (evt: any, ui: any) {
          // start reducer
          that._data.volume = ui.value;

          if (that._data.volume === 0) {
            that._lastVolume = 0;
          }
          // end reducer

          that.fire(VolumeEvents.VOLUME_CHANGED, that._data.volume);
        },
        stop: function (evt: any, ui: any) {},
      });

      return success;
    }

    public set(data: IAVVolumeControlState): void {
      this._data = Object.assign(this._data, data);

      this._render();
    }

    private _render(): void {
      if (this._data.volume !== undefined) {
        this._$volumeSlider.slider({
          value: this._data.volume,
        });

        if (this._data.volume === 0) {
          const label: string = this.options.data.content.unmute;
          this._$volumeMute.prop("title", label);
          this._$volumeMute.find("i").switchClass("on", "off");
        } else {
          const label: string = this.options.data.content.mute;
          this._$volumeMute.prop("title", label);
          this._$volumeMute.find("i").switchClass("off", "on");
        }
      }
    }

    protected _resize(): void {}
  }

  export class VolumeEvents {
    static VOLUME_CHANGED: string = "volumechanged";
  }

  export class CanvasInstance extends _Components.BaseComponent {
    private _$canvasContainer: JQuery;
    private _$canvasDuration: JQuery;
    private _$canvasHoverHighlight: JQuery;
    private _$canvasHoverPreview: JQuery;
    private _$canvasTime: JQuery;
    private _$canvasTimelineContainer: JQuery;
    private _$controlsContainer: JQuery;
    private _$durationHighlight: JQuery;
    private _$hoverPreviewTemplate: JQuery;
    private _$nextButton: JQuery;
    private _$fastForward: JQuery;
    private _$fastRewind: JQuery;
    private _$optionsContainer: JQuery;
    private _$playButton: JQuery;
    private _$prevButton: JQuery;
    private _$rangeHoverHighlight: JQuery;
    private _$rangeHoverPreview: JQuery;
    private _$rangeTimelineContainer: JQuery;
    private _$timeDisplay: JQuery;
    private _$timelineItemContainer: JQuery;
    private _canvasClockFrequency: number = 25;
    private _canvasClockInterval: number;
    private _canvasClockStartDate: number = 0;
    private _canvasClockTime: number = 0;
    private _canvasHeight: number = 0;
    private _canvasWidth: number = 0;
    private _compositeWaveform: CompositeWaveform;
    private _contentAnnotations: any[]; // todo: type as HTMLMediaElement?
    private _data: IAVCanvasInstanceData = this.data();
    private _highPriorityFrequency: number = 25;
    private _highPriorityInterval: number;
    private _isPlaying: boolean = false;
    private _isStalled: boolean = false;
    //private _lastCanvasHeight: number | undefined;
    //private _lastCanvasWidth: number | undefined;
    private _lowPriorityFrequency: number = 250;
    private _lowPriorityInterval: number;
    private _mediaSyncMarginSecs: number = 1;
    private _rangeSpanPadding: number = 0.25;
    private _readyMediaCount: number = 0;
    private _stallRequestedBy: any[] = []; //todo: type
    private _volume: AVVolumeControl;
    private _wasPlaying: boolean = false;
    private _waveformCanvas: HTMLCanvasElement | null;
    private _waveformCtx: CanvasRenderingContext2D | null;
    //private _waveformNeedsRedraw: boolean = true;
    public ranges: Manifesto.Range[] = [];
    public waveforms: string[] = [];
    private _buffering = false;
    private _bufferShown = false;
    public $playerElement: JQuery;
    public isOnlyCanvasInstance: boolean = false;
    public logMessage: (message: string) => void;
    public timePlanPlayer: AVHelpers.TimePlanPlayer;

    constructor(options: _Components.IBaseComponentOptions) {
      super(options);
      this._data = this.options.data;
      this.$playerElement = $('<div class="player player--loading"></div>');
    }

    public loaded(): void {
      setTimeout(() => {
        this.$playerElement.removeClass("player--loading");
      }, 500);
    }

    public isPlaying(): boolean {
      return this._isPlaying;
    }

    public getClockTime(): number {
      return this._canvasClockTime;
    }

    public createTimeStops() {
      const helper = this._data.helper;
      const canvas = this._data.canvas as VirtualCanvas;
      if (!helper || !canvas) {
        return;
      }

      this.ranges = [];
      this._contentAnnotations = [];

      const canvases = canvas.canvases;
      const mediaElements: AVHelpers.MediaElement[] = [];
      for (const canvas of canvases) {
        const annotations = canvas.getContent();
        for (const annotation of annotations) {
          const annotationBody = AVHelpers.extractMediaFromAnnotationBodies(
            annotation
          );
          if (!annotationBody) continue;
          const mediaSource = AVHelpers.getMediaSourceFromAnnotationBody(
            annotation,
            annotationBody,
            {
              id: canvas.id,
              duration: canvas.getDuration() || 0,
              height: canvas.getHeight(),
              width: canvas.getWidth(),
            }
          );

          const mediaElement = new AVHelpers.MediaElement(mediaSource, {
            adaptiveAuthEnabled: this._data.adaptiveAuthEnabled,
          });

          mediaElement.setSize(
            this._convertToPercentage(mediaSource.x || 0, canvas.getHeight()),
            this._convertToPercentage(mediaSource.y || 0, canvas.getWidth()),
            this._convertToPercentage(
              mediaSource.width || canvas.getWidth(),
              canvas.getWidth()
            ),
            this._convertToPercentage(
              mediaSource.height || canvas.getHeight(),
              canvas.getHeight()
            )
          );

          mediaElements.push(mediaElement);

          const seeAlso: any = annotation.getProperty("seeAlso");
          if (seeAlso && seeAlso.length) {
            const dat: string = seeAlso[0].id;
            this.waveforms.push(dat);
          }
        }
      }

      const compositeMediaElement = new AVHelpers.CompositeMediaElement(
        mediaElements
      );

      compositeMediaElement.appendTo(this.$playerElement);

      compositeMediaElement.load().then(() => {
        // this._updateDurationDisplay();
        this.fire(Events.MEDIA_READY);
      });

      // this._renderSyncIndicator(data)

      const plan = AVHelpers.createTimePlansFromManifest(
        helper.manifest as any,
        mediaElements
      );

      // @ts-ignore
      window.timePlanPlayer = this.timePlanPlayer = new AVHelpers.TimePlanPlayer(
        compositeMediaElement,
        plan,
        (rangeId) => {
          this.setCurrentRangeId(rangeId, { autoChanged: true });
        },
        (time) => {
          this._canvasClockTime = time;
        },
        (isPlaying) => {
          if (isPlaying) {
            this.play();
          } else {
            this.pause();
          }
        }
      );

      // 1) DONE - Create list of all the media and load into the DOM.
      // 2) DONE - Create the time stops, with references to the media.
      // 3) Set canvas height and width
      // 4) Attach button events (this this class)
      // 5) Create slider and containers
      // 6) Push wave forms

      // this.fire(Events.MEDIA_READY);
      // - Which increments a "number loaded"
      // - Maybe change this.
    }

    public init() {
      if (!this._data || !this._data.content || !this._data.canvas) {
        console.warn("unable to initialise, missing canvas or content");
        return;
      }

      this._$hoverPreviewTemplate = $(
        '<div class="hover-preview"><div class="label"></div><div class="pointer"><span class="arrow"></span></div></div>'
      );
      this._$canvasContainer = $('<div class="canvas-container"></div>');
      this._$optionsContainer = $('<div class="options-container"></div>');
      this._$rangeTimelineContainer = $(
        '<div class="range-timeline-container"></div>'
      );
      this._$canvasTimelineContainer = $(
        '<div class="canvas-timeline-container"></div>'
      );
      this._$canvasHoverPreview = this._$hoverPreviewTemplate.clone();
      this._$canvasHoverHighlight = $('<div class="hover-highlight"></div>');
      this._$rangeHoverPreview = this._$hoverPreviewTemplate.clone();
      this._$rangeHoverHighlight = $('<div class="hover-highlight"></div>');
      this._$durationHighlight = $('<div class="duration-highlight"></div>');
      this._$timelineItemContainer = $(
        '<div class="timeline-item-container"></div>'
      );
      this._$controlsContainer = $('<div class="controls-container"></div>');
      this._$prevButton = $(`
                                <button class="btn" title="${this._data.content.previous}">
                                    <i class="av-icon av-icon-previous" aria-hidden="true"></i>${this._data.content.previous}
                                </button>`);
      this._$playButton = $(`
                                <button class="btn" title="${this._data.content.play}">
                                    <i class="av-icon av-icon-play play" aria-hidden="true"></i>${this._data.content.play}
                                </button>`);
      this._$nextButton = $(`
                                <button class="btn" title="${this._data.content.next}">
                                    <i class="av-icon av-icon-next" aria-hidden="true"></i>${this._data.content.next}
                                </button>`);
      this._$fastForward = $(`
                                <button class="btn" title="${
                                  this._data.content.next
                                }">
                                    <i class="av-icon av-icon-fast-forward" aria-hidden="true"></i>${
                                      this._data.content.fastForward || ""
                                    }
                                </button>`);
      this._$fastRewind = $(`
                                <button class="btn" title="${
                                  this._data.content.next
                                }">
                                    <i class="av-icon av-icon-fast-rewind" aria-hidden="true"></i>${
                                      this._data.content.fastRewind || ""
                                    }
                                </button>`);

      this._$timeDisplay = $(
        '<div class="time-display"><span class="canvas-time"></span> / <span class="canvas-duration"></span></div>'
      );
      this._$canvasTime = this._$timeDisplay.find(".canvas-time");
      this._$canvasDuration = this._$timeDisplay.find(".canvas-duration");

      if (this.isVirtual()) {
        this.$playerElement.addClass("virtual");
      }

      const $volume: JQuery = $('<div class="volume"></div>');
      this._volume = new AVVolumeControl({
        target: $volume[0] as HTMLElement,
        data: Object.assign({}, this._data),
      });

      this._volume.on(
        VolumeEvents.VOLUME_CHANGED,
        (value: number) => {
          this.fire(VolumeEvents.VOLUME_CHANGED, value);
        },
        false
      );

      // @todo make the buttons for FF and FR configurable.
      this._$controlsContainer.append(
        this._$prevButton,
        this._data.enableFastRewind ? this._$fastRewind : null,
        this._$playButton,
        this._data.enableFastForward ? this._$fastForward : null,
        this._$nextButton,
        this._$timeDisplay,
        $volume
      );
      this._$canvasTimelineContainer.append(
        this._$canvasHoverPreview,
        this._$canvasHoverHighlight,
        this._$durationHighlight
      );
      this._$rangeTimelineContainer.append(
        this._$rangeHoverPreview,
        this._$rangeHoverHighlight
      );
      this._$optionsContainer.append(
        this._$canvasTimelineContainer,
        this._$rangeTimelineContainer,
        this._$controlsContainer
      );
      this.$playerElement.append(
        this._$canvasContainer,
        this._$optionsContainer
      );

      this._$canvasHoverPreview.hide();
      this._$rangeHoverPreview.hide();

      const newRanges = this.isVirtual() && AVComponent.newRanges;

      // Should bootstrap ranges and content.
      if (newRanges) {
        this.createTimeStops();
      }

      if (!newRanges) {
        if (this._data && this._data.helper && this._data.canvas) {
          let ranges: Manifesto.Range[] = [];

          // if the canvas is virtual, get the ranges for all sub canvases
          if (this.isVirtual()) {
            // @todo - create time slices.

            (<VirtualCanvas>this._data.canvas).canvases.forEach(
              (canvas: Manifesto.Canvas) => {
                if (this._data && this._data.helper) {
                  let r: Manifesto.Range[] = this._data.helper.getCanvasRanges(
                    canvas
                  );

                  let clonedRanges: Manifesto.Range[] = [];

                  // shift the range targets forward by the duration of their previous canvases
                  r.forEach((range: Manifesto.Range) => {
                    const clonedRange = jQuery.extend(true, {}, range);
                    clonedRanges.push(clonedRange);

                    if (clonedRange.canvases && clonedRange.canvases.length) {
                      for (let i = 0; i < clonedRange.canvases.length; i++) {
                        clonedRange.canvases[i] = <string>(
                          AVComponentUtils.retargetTemporalComponent(
                            (<VirtualCanvas>this._data.canvas).canvases,
                            clonedRange.__jsonld.items[i].id
                          )
                        );
                      }
                    }
                  });

                  ranges.push(...clonedRanges);
                }
              }
            );
          } else {
            ranges = ranges.concat(
              this._data.helper.getCanvasRanges(
                this._data.canvas as Manifesto.Canvas
              )
            );
          }

          ranges.forEach((range: Manifesto.Range) => {
            this.ranges.push(range);
          });
        }
      }

      const canvasWidth: number = this._data.canvas.getWidth();
      const canvasHeight: number = this._data.canvas.getHeight();

      if (!canvasWidth) {
        this._canvasWidth = <number>this.$playerElement.parent().width(); // this._data.defaultCanvasWidth;
      } else {
        this._canvasWidth = canvasWidth;
      }

      if (!canvasHeight) {
        this._canvasHeight =
          this._canvasWidth * <number>this._data.defaultAspectRatio; //this._data.defaultCanvasHeight;
      } else {
        this._canvasHeight = canvasHeight;
      }

      const that = this;

      let prevClicks: number = 0;
      let prevTimeout: number = 0;

      this._$prevButton.on("touchstart click", (e) => {
        e.preventDefault();

        prevClicks++;

        if (prevClicks === 1) {
          // single click
          this._previous(false);
          prevTimeout = setTimeout(() => {
            prevClicks = 0;
            prevTimeout = 0;
          }, this._data.doubleClickMS);
        } else {
          // double click
          this._previous(true);
          clearTimeout(prevTimeout);
          prevClicks = 0;
          prevTimeout = 0;
        }
      });

      this._$playButton.on("touchstart click", (e) => {
        e.preventDefault();

        if (this._isPlaying) {
          this.pause();
        } else {
          this.play();
        }
      });

      this._$nextButton.on("touchstart click", (e) => {
        e.preventDefault();

        this._next();
      });

      this._$fastForward.on("touchstart click", (e) => {
        const { end } = this.getRangeTiming();
        const goToTime = this.getClockTime() + 20;
        if (goToTime < end) {
          return this._setCurrentTime(goToTime);
        }
        return this._setCurrentTime(end);
      });

      this._$fastRewind.on("touchstart click", (e) => {
        const { start } = this.getRangeTiming();
        const goToTime = this.getClockTime() - 20;
        if (goToTime >= start) {
          return this._setCurrentTime(goToTime);
        }
        return this._setCurrentTime(start);
      });

      if (newRanges) {
        this._$canvasTimelineContainer.slider({
          value: 0,
          step: 0.01,
          orientation: "horizontal",
          range: "min",
          min: 0,
          max: this.timePlanPlayer.getDuration(),
          animate: false,
          slide: (evt: any, ui: any) => {
            this._setCurrentTime(this.timePlanPlayer.plan.start + ui.value);
          },
        });
      } else {
        this._$canvasTimelineContainer.slider({
          value: 0,
          step: 0.01,
          orientation: "horizontal",
          range: "min",
          max: that._getDuration(),
          animate: false,
          create: function (evt: any, ui: any) {
            // on create
          },
          slide: function (evt: any, ui: any) {
            that._setCurrentTime(ui.value);
          },
          stop: function (evt: any, ui: any) {
            //this._setCurrentTime(ui.value);
          },
        });
      }

      this._$canvasTimelineContainer.mouseout(() => {
        that._$canvasHoverHighlight.width(0);
        that._$canvasHoverPreview.hide();
      });

      this._$rangeTimelineContainer.mouseout(() => {
        that._$rangeHoverHighlight.width(0);
        that._$rangeHoverPreview.hide();
      });

      this._$canvasTimelineContainer.on("mousemove", (e) => {
        if (newRanges) {
          this._updateHoverPreview(
            e,
            this._$canvasTimelineContainer,
            this.timePlanPlayer.getDuration()
          );
        } else {
          this._updateHoverPreview(
            e,
            this._$canvasTimelineContainer,
            this._getDuration()
          );
        }
      });

      this._$rangeTimelineContainer.on("mousemove", (e) => {
        if (newRanges) {
          this._updateHoverPreview(
            e,
            this._$canvasTimelineContainer,
            this.timePlanPlayer.getDuration()
          );
        } else if (this._data.range) {
          const duration:
            | Manifesto.Duration
            | undefined = this._data.range.getDuration();
          this._updateHoverPreview(
            e,
            this._$rangeTimelineContainer,
            duration ? duration.getLength() : 0
          );
        }
      });

      if (newRanges) {
        return;
      }

      // create annotations

      this._contentAnnotations = [];

      const items: Manifesto.Annotation[] = this._data.canvas.getContent(); // (<any>this._data.canvas).__jsonld.content[0].items;

      // always hide timelineItemContainer for now
      //if (items.length === 1) {
      this._$timelineItemContainer.hide();
      //}

      for (let i = 0; i < items.length; i++) {
        const item: Manifesto.Annotation = items[i];

        /*
                if (item.motivation != 'painting') {
                    return null;
                }
                */

        let mediaSource: any;
        const bodies: Manifesto.AnnotationBody[] = item.getBody();

        if (!bodies.length) {
          console.warn("item has no body");
          return;
        }

        const body: Manifesto.AnnotationBody | null = this._getBody(bodies);

        if (!body) {
          // if no suitable format was found for the current browser, skip this item.
          console.warn("unable to find suitable format for", item.id);
          continue;
        }

        const type: string | null = body.getType();
        const format: MediaType | null = body.getFormat();

        // if (type && type.toString() === 'choice') {
        //     // Choose first "Choice" item as body
        //     const tmpItem = item;
        //     item.body = tmpItem.body[0].items[0];
        //     mediaSource = item.body.id.split('#')[0];
        // } else

        if (type && type.toString() === "textualbody") {
          //mediaSource = (<any>body).value;
        } else {
          mediaSource = body.id.split("#")[0];
        }

        /*
                var targetFragment = (item.target.indexOf('#') != -1) ? item.target.split('#t=')[1] : '0, '+ canvasClockDuration,
                    fragmentTimings = targetFragment.split(','),
                    startTime = parseFloat(fragmentTimings[0]),
                    endTime = parseFloat(fragmentTimings[1]);

                //TODO: Check format (in "target" as MFID or in "body" as "width", "height" etc.)
                var fragmentPosition = [0, 0, 100, 100],
                    positionTop = fragmentPosition[1],
                    positionLeft = fragmentPosition[0],
                    mediaWidth = fragmentPosition[2],
                    mediaHeight = fragmentPosition[3];
                */

        const target: string | null = item.getTarget();

        if (!target) {
          console.warn("item has no target");
          return;
        }

        let xywh: number[] | null = AVComponentUtils.getSpatialComponent(
          target
        );
        let t: number[] | null = Manifesto.Utils.getTemporalComponent(target);

        if (!xywh) {
          xywh = [0, 0, this._canvasWidth, this._canvasHeight];
        }

        if (!t) {
          t = [0, this._getDuration()];
        }

        const positionLeft = parseInt(String(xywh[0])),
          positionTop = parseInt(String(xywh[1])),
          mediaWidth = parseInt(String(xywh[2])),
          mediaHeight = parseInt(String(xywh[3])),
          startTime = parseInt(String(t[0])),
          endTime = parseInt(String(t[1]));

        const percentageTop = this._convertToPercentage(
            positionTop,
            this._canvasHeight
          ),
          percentageLeft = this._convertToPercentage(
            positionLeft,
            this._canvasWidth
          ),
          percentageWidth = this._convertToPercentage(
            mediaWidth,
            this._canvasWidth
          ),
          percentageHeight = this._convertToPercentage(
            mediaHeight,
            this._canvasHeight
          );

        const temporalOffsets: RegExpExecArray | null = /t=([^&]+)/g.exec(
          body.id
        );

        let ot;

        if (temporalOffsets && temporalOffsets[1]) {
          ot = temporalOffsets[1].split(",");
        } else {
          ot = [null, null];
        }

        const offsetStart = ot[0] ? parseInt(<string>ot[0]) : ot[0],
          offsetEnd = ot[1] ? parseInt(<string>ot[1]) : ot[1];

        // todo: type this
        const itemData: any = {
          active: false,
          end: endTime,
          endOffset: offsetEnd,
          format: format,
          height: percentageHeight,
          left: percentageLeft,
          source: mediaSource,
          start: startTime,
          startOffset: offsetStart,
          top: percentageTop,
          type: type,
          width: percentageWidth,
        };

        this._renderMediaElement(itemData);

        // waveform

        // todo: create annotation.getSeeAlso
        const seeAlso: any = item.getProperty("seeAlso");

        if (seeAlso && seeAlso.length) {
          const dat: string = seeAlso[0].id;
          this.waveforms.push(dat);
        }
      }
    }

    private _getBody(
      bodies: Manifesto.AnnotationBody[]
    ): Manifesto.AnnotationBody | null {
      // if there's an HLS format and HLS is supported in this browser
      for (let i = 0; i < bodies.length; i++) {
        const body: Manifesto.AnnotationBody = bodies[i];
        const format: MediaType | null = body.getFormat();

        if (format) {
          if (
            AVComponentUtils.isHLSFormat(format) &&
            AVComponentUtils.canPlayHls()
          ) {
            return body;
          }
        }
      }

      // if there's a Dash format and the browser isn't Safari
      for (let i = 0; i < bodies.length; i++) {
        const body: Manifesto.AnnotationBody = bodies[i];
        const format: MediaType | null = body.getFormat();

        if (format) {
          if (
            AVComponentUtils.isMpegDashFormat(format) &&
            !AVComponentUtils.isSafari()
          ) {
            return body;
          }
        }
      }

      // otherwise, return the first format that isn't HLS or Dash
      for (let i = 0; i < bodies.length; i++) {
        const body: Manifesto.AnnotationBody = bodies[i];
        const format: MediaType | null = body.getFormat();

        if (format) {
          if (
            !AVComponentUtils.isHLSFormat(format) &&
            !AVComponentUtils.isMpegDashFormat(format)
          ) {
            return body;
          }
        }
      }

      // couldn't find a suitable format
      return null;
    }

    private _getDuration(): number {
      if (this.isVirtual() && AVComponent.newRanges) {
        return this.timePlanPlayer.getDuration();
      }

      if (this._data && this._data.canvas) {
        return Math.floor(<number>this._data.canvas.getDuration());
      }

      return 0;
    }

    public data(): IAVCanvasInstanceData {
      return <IAVCanvasInstanceData>{
        waveformColor: "#fff",
        waveformBarSpacing: 4,
        waveformBarWidth: 2,
        volume: 1,
      };
    }

    public isVirtual(): boolean {
      return this._data.canvas instanceof VirtualCanvas;
    }

    public isVisible(): boolean {
      return !!this._data.visible;
    }

    public includesVirtualSubCanvas(canvasId: string): boolean {
      if (
        this.isVirtual() &&
        this._data.canvas &&
        (<VirtualCanvas>this._data.canvas).canvases
      ) {
        for (
          let i = 0;
          i < (<VirtualCanvas>this._data.canvas).canvases.length;
          i++
        ) {
          const canvas: Manifesto.Canvas = (<VirtualCanvas>this._data.canvas)
            .canvases[i];
          if (Manifesto.Utils.normaliseUrl(canvas.id) === canvasId) {
            return true;
          }
        }
      }

      return false;
    }

    setVisibility(visibility: boolean) {
      if (this._data.visible === visibility) {
        return;
      }

      this._data.visible = visibility;
      if (visibility) {
        this._rewind();
        this.$playerElement.show();
      } else {
        this.$playerElement.hide();
        this.pause();
      }
      this.resize();
    }

    viewRange(rangeId: string) {
      if (this.currentRange !== rangeId) {
        console.log(`Switching range from ${this.currentRange} to ${rangeId}`);
        this.setCurrentRangeId(rangeId);
        // Entrypoint for changing a range. Only get's called when change came from external source.
        this._setCurrentTime(this.timePlanPlayer.setRange(rangeId), true);

        this._render();
      }
    }

    limitToRange: boolean;
    currentRange?: string;
    setCurrentRangeId(
      range: null | string,
      {
        autoChanged = false,
        limitToRange = false,
      }: { autoChanged?: boolean; limitToRange?: boolean } = {}
    ) {
      if (!this.currentRange && range && this.limitToRange) {
        // @todo which case was this covering..
        //this.limitToRange = false;
      }

      console.log("Setting current range id", range);

      // This is the end of the chain for changing a range.
      if (range && this.currentRange !== range) {
        this.currentRange = range;
        this.fire(Events.RANGE_CHANGED, range);
      } else if (range === null) {
        this.currentRange = undefined;
        this.fire(Events.RANGE_CHANGED, null);
      }

      this._render();
    }

    setVolume(volume: number) {
      this._volume.set({ volume });
      this.timePlanPlayer.setVolume(volume);
    }

    setLimitToRange(limitToRange: boolean) {
      console.log(this._data.constrainNavigationToRange);
      if (this.limitToRange !== limitToRange) {
        this.limitToRange = limitToRange;
        this._render();
      }
    }

    public set(data: IAVCanvasInstanceData): void {
      // Simplification of setting state.
      if (AVComponent.newRanges && this.isVirtual()) {
        if (typeof data.range !== "undefined")
          this.setCurrentRangeId(data.range.id, {
            limitToRange: data.limitToRange,
          });
        if (typeof data.rangeId !== "undefined")
          this.setCurrentRangeId(data.rangeId, {
            limitToRange: data.limitToRange,
          });
        if (typeof data.volume !== "undefined") this.setVolume(data.volume);
        if (typeof data.limitToRange !== "undefined")
          this.setLimitToRange(data.limitToRange);
        if (typeof data.visible !== "undefined")
          this.setVisibility(data.visible);

        return;
      }

      const oldData: IAVCanvasInstanceData = Object.assign({}, this._data);
      this._data = Object.assign(this._data, data);
      const diff: string[] = AVComponentUtils.diff(oldData, this._data);

      if (diff.includes("visible")) {
        if (this._data.canvas) {
          if (this._data.visible) {
            this._rewind();
            this.$playerElement.show();
          } else {
            this.$playerElement.hide();
            this.pause();
          }

          this.resize();
        }
      }

      if (diff.includes("range")) {
        if (this._data.helper) {
          if (!this._data.range) {
            this.fire(Events.RANGE_CHANGED, null);
          } else {
            const duration:
              | Manifesto.Duration
              | undefined = this._data.range.getDuration();

            if (duration) {
              if (typeof duration !== "undefined") {
                // Only change the current time if the current time is outside of the current time.
                if (
                  duration.start >= this._canvasClockTime ||
                  duration.end <= this._canvasClockTime
                ) {
                  this._setCurrentTime(duration.start);
                }

                if (this._data.autoPlay) {
                  this.play();
                }

                this.fire(
                  Events.RANGE_CHANGED,
                  this._data.range.id,
                  this._data.range
                );
              }
            }
          }
        }

        if (diff.includes("volume")) {
          this._contentAnnotations.forEach(($mediaElement: any) => {
            const volume: number =
              this._data.volume !== undefined ? this._data.volume : 1;

            $($mediaElement.element).prop("volume", volume);

            this._volume.set({
              volume: this._data.volume,
            });
          });
        } else {
          if (this.isVisible()) {
            this._render();
          }
        }

        if (diff.includes("limitToRange")) {
          this._render();
        }
      }
    }

    private _hasRangeChanged(): void {
      if (this.isVirtual() && AVComponent.newRanges) {
        return;
      }

      const range:
        | Manifesto.Range
        | undefined = this._getRangeForCurrentTime();

      if (
        range &&
        !this._data.limitToRange &&
        (!this._data.range ||
          (this._data.range && range.id !== this._data.range.id))
      ) {
        console.log("Did you change the range?", range);
        this.set({
          range: jQuery.extend(true, { autoChanged: true }, range),
        });
      }
    }

    private _getRangeForCurrentTime(
      parentRange?: Manifesto.Range
    ): Manifesto.Range | undefined {
      let ranges: Manifesto.Range[];

      if (!parentRange) {
        ranges = this.ranges;
      } else {
        ranges = parentRange.getRanges();
      }

      for (let i = 0; i < ranges.length; i++) {
        const range: Manifesto.Range = ranges[i];
        const rangeBehavior = range.getBehavior();
        if (rangeBehavior && rangeBehavior !== 'no-nav') {
          continue;
        }

        // if the range spans the current time, and is navigable, return it.
        // otherwise, try to find a navigable child range.
        if (this._rangeSpansCurrentTime(range)) {
          if (this._rangeNavigable(range)) {
            return range;
          }

          const childRanges: Manifesto.Range[] = range.getRanges();

          // if a child range spans the current time, recurse into it
          for (let i = 0; i < childRanges.length; i++) {
            const childRange: Manifesto.Range = childRanges[i];

            if (this._rangeSpansCurrentTime(childRange)) {
              return this._getRangeForCurrentTime(childRange);
            }
          }

          // this range isn't navigable, and couldn't find a navigable child range.
          // therefore return the parent range (if any).
          return range.parentRange;
        }
      }

      return undefined;
    }

    private _rangeSpansCurrentTime(range: Manifesto.Range): boolean {
      if (
        range.spansTime(
          Math.ceil(this._canvasClockTime) + this._rangeSpanPadding
        )
      ) {
        return true;
      }

      return false;
    }

    private _rangeNavigable(range: Manifesto.Range): boolean {
      const behavior: Behavior | null = range.getBehavior();

      if (
        behavior &&
        behavior.toString() === 'no-nav'
      ) {
        return false;
      }

      return true;
    }

    private _render(): void {
      if (this.isVirtual() && AVComponent.newRanges && this.isVisible()) {
        console.groupCollapsed("Rendering a new range!");
        console.log({
          dataRange: this._data.rangeId,
          range: this.currentRange,
          newLimitToRange: this.limitToRange,
          constraintToRange: this._data.constrainNavigationToRange,
          autoSelectRange: this._data.autoSelectRange,
        });

        // 3 ways to render:
        // Limit to range + no id = show everything
        // Limit to range + id = show everything in context
        // No limit to range = show everything
        // No limit -> Limit (+ range) = show just range

        // - Range id + limitToRange
        // - Range id
        // - nothing

        if (this.limitToRange && this.currentRange) {
          console.log("Selecting plan...", this.currentRange);
          this.timePlanPlayer.selectPlan({ rangeId: this.currentRange });
        } else {
          console.log("Resetting...");
          this.timePlanPlayer.selectPlan({ reset: true });
        }

        const ratio =
          this._$canvasTimelineContainer.width() /
          this.timePlanPlayer.getDuration();
        this._$durationHighlight.show();

        const { start, duration } = this.timePlanPlayer.getCurrentRange();

        this._$canvasTimelineContainer.slider({
          value: this._canvasClockTime - this.timePlanPlayer.plan.start,
          max: this.timePlanPlayer.getDuration(),
        });

        // set the start position and width
        this._$durationHighlight.css({
          left: start * ratio,
          width: duration * ratio,
        });

        console.groupEnd();

        this._updateCurrentTimeDisplay();
        this._updateDurationDisplay();
        this._drawWaveform();

        return;
      }

      // Hide/show UI elements regardless of visibility.
      if (this._data.limitToRange && this._data.range) {
        this._$canvasTimelineContainer.hide();
        this._$rangeTimelineContainer.show();
      } else {
        this._$canvasTimelineContainer.show();
        this._$rangeTimelineContainer.hide();
      }

      if (!this._data.range) {
        this._$durationHighlight.hide();
      }

      // Return early if the current CanvasInstance isn't visible
      if (!this.isVisible()) {
        return;
      }
      if (!this.isOnlyCanvasInstance && !this.isVirtual()) {
        return;
      }

      // Render otherwise.
      if (this._data.range && !(this.isVirtual() && AVComponent.newRanges)) {
        const duration:
          | Manifesto.Duration
          | undefined = this._data.range.getDuration();

        if (duration) {
          // get the total length in seconds.
          const totalDuration: number = this._getDuration();

          // get the length of the timeline container
          const timelineLength: number = <number>(
            this._$canvasTimelineContainer.width()
          );

          // get the ratio of seconds to length
          const ratio: number = timelineLength / totalDuration;
          const totalLength = totalDuration * ratio;
          const start: number = duration.start * ratio;
          let end: number = duration.end * ratio;

          // if the end is on the next canvas
          if (end > totalLength || end < start) {
            end = totalLength;
          }

          const width: number = end - start;

          if (this.isVirtual() || this.isOnlyCanvasInstance) {
            this._$durationHighlight.show();
            // set the start position and width
            this._$durationHighlight.css({
              left: start,
              width: width,
            });
          } else {
            this._$durationHighlight.hide();
          }

          const that = this;

          // try to destroy existing rangeTimelineContainer
          if (this._$rangeTimelineContainer.data("ui-sortable")) {
            this._$rangeTimelineContainer.slider("destroy");
          }

          this._$rangeTimelineContainer.slider({
            value: duration.start,
            step: 0.01,
            orientation: "horizontal",
            range: "min",
            min: duration.start,
            max: duration.end,
            animate: false,
            create: function (evt: any, ui: any) {
              // on create
            },
            slide: function (evt: any, ui: any) {
              that._setCurrentTime(ui.value);
            },
            stop: function (evt: any, ui: any) {
              //this._setCurrentTime(ui.value);
            },
          });
        }
      }

      this._updateCurrentTimeDisplay();
      this._updateDurationDisplay();
      this._drawWaveform();
    }

    public getCanvasId(): string | undefined {
      if (this._data && this._data.canvas) {
        return this._data.canvas.id;
      }

      return undefined;
    }

    private _updateHoverPreview(
      e: any,
      $container: JQuery,
      duration: number
    ): void {
      const offset = <any>$container.offset();

      const x = e.pageX - offset.left;

      const $hoverArrow: JQuery = $container.find(".arrow");
      const $hoverHighlight: JQuery = $container.find(".hover-highlight");
      const $hoverPreview: JQuery = $container.find(".hover-preview");

      $hoverHighlight.width(x);

      const fullWidth: number = <number>$container.width();
      const ratio: number = x / fullWidth;
      const seconds: number = Math.min(duration * ratio);
      $hoverPreview.find(".label").text(AVComponentUtils.formatTime(seconds));
      const hoverPreviewWidth: number = <number>$hoverPreview.outerWidth();
      const hoverPreviewHeight: number = <number>$hoverPreview.outerHeight();

      let left: number = x - hoverPreviewWidth * 0.5;
      let arrowLeft: number = hoverPreviewWidth * 0.5 - 6;

      if (left < 0) {
        left = 0;
        arrowLeft = x - 6;
      }

      if (left + hoverPreviewWidth > fullWidth) {
        left = fullWidth - hoverPreviewWidth;
        arrowLeft = hoverPreviewWidth - (fullWidth - x) - 6;
      }

      $hoverPreview
        .css({
          left: left,
          top: hoverPreviewHeight * -1 + "px",
        })
        .show();

      $hoverArrow.css({
        left: arrowLeft,
      });
    }

    private _previous(isDouble: boolean): void {
      if (AVComponent.newRanges && this.isVirtual()) {
        console.groupCollapsed("prev");
        const newTime = this.timePlanPlayer.previous();
        this._setCurrentTime(newTime);
        console.log("new time -> ", newTime);
        console.groupEnd();
        return;
      }

      if (this._data.limitToRange) {
        // if only showing the range, single click rewinds, double click goes to previous range unless navigation is contrained to range
        if (isDouble) {
          if (this._isNavigationConstrainedToRange()) {
            this._rewind();
          } else {
            this.fire(CanvasInstanceEvents.PREVIOUS_RANGE);
          }
        } else {
          this._rewind();
        }
      } else {
        // not limited to range.
        // if there is a currentDuration, single click goes to previous range, double click clears current duration and rewinds.
        // if there is no currentDuration, single and double click rewinds.
        if (this._data.range) {
          if (isDouble) {
            this.set({
              range: undefined,
            });
            this._rewind();
          } else {
            this.fire(CanvasInstanceEvents.PREVIOUS_RANGE);
          }
        } else {
          this._rewind();
        }
      }
    }

    private _next(): void {
      if (AVComponent.newRanges && this.isVirtual()) {
        console.groupCollapsed("next");
        this._setCurrentTime(this.timePlanPlayer.next(), false);
        console.groupEnd();
        return;
      }
      if (this._data.limitToRange) {
        if (this._isNavigationConstrainedToRange()) {
          this._fastforward();
        } else {
          this.fire(CanvasInstanceEvents.NEXT_RANGE);
        }
      } else {
        this.fire(CanvasInstanceEvents.NEXT_RANGE);
      }
    }

    public destroy(): void {
      window.clearInterval(this._highPriorityInterval);
      window.clearInterval(this._lowPriorityInterval);
      window.clearInterval(this._canvasClockInterval);
    }

    private _convertToPercentage(pixelValue: number, maxValue: number): number {
      const percentage: number = (pixelValue / maxValue) * 100;
      return percentage;
    }

    private _renderMediaElement(data: any): void {
      let $mediaElement;
      let type: string = data.type.toString().toLowerCase();

      switch (type) {
        case "video":
          $mediaElement = $('<video crossorigin="anonymous" class="anno" />');
          break;
        case "sound":
        case "audio":
          $mediaElement = $('<audio crossorigin="anonymous" class="anno" />');
          break;
        // case 'textualbody':
        //     $mediaElement = $('<div class="anno">' + data.source + '</div>');
        //     break;
        // case 'image':
        //     $mediaElement = $('<img class="anno" src="' + data.source + '" />');
        //     break;
        default:
          return;
      }

      const media: HTMLMediaElement = $mediaElement[0] as HTMLMediaElement;
      //
      // var audioCtx = new AudioContext();
      // var source = audioCtx.createMediaElementSource(media);
      // var panNode = audioCtx.createStereoPanner();
      // var val = -1;
      // setInterval(() => {
      //     val = val === -1 ? 1 : -1;
      //     panNode.pan.setValueAtTime(val, audioCtx.currentTime);
      //     if (val === 1) {
      //         media.playbackRate = 2;
      //     } else {
      //         // media.playbackRate = 1;
      //     }
      // }, 1000);
      // source.connect(panNode);
      // panNode.connect(audioCtx.destination);

      if (data.format && data.format.toString() === "application/dash+xml") {
        // dash
        $mediaElement.attr("data-dashjs-player", "");
        const player = dashjs.MediaPlayer().create();
        player.getDebug().setLogToBrowserConsole(false);
        // player.getDebug().setLogToBrowserConsole(true);
        // player.getDebug().setLogLevel(4);
        if (this._data.adaptiveAuthEnabled) {
          player.setXHRWithCredentialsForType("MPD", true); // send cookies
        }
        player.initialize(media, data.source);
      } else if (
        data.format &&
        data.format.toString() === "application/vnd.apple.mpegurl"
      ) {
        // hls
        if (Hls.isSupported()) {
          let hls = new Hls();

          if (this._data.adaptiveAuthEnabled) {
            hls = new Hls({
              xhrSetup: (xhr: any) => {
                xhr.withCredentials = true; // send cookies
              },
            });
          } else {
            hls = new Hls();
          }

          if (this._data.adaptiveAuthEnabled) {
          }

          hls.loadSource(data.source);
          hls.attachMedia(media);
          //hls.on(Hls.Events.MANIFEST_PARSED, function () {
          //media.play();
          //});
        }
        // hls.js is not supported on platforms that do not have Media Source Extensions (MSE) enabled.
        // When the browser has built-in HLS support (check using `canPlayType`), we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video element throught the `src` property.
        // This is using the built-in support of the plain video element, without using hls.js.
        else if (media.canPlayType("application/vnd.apple.mpegurl")) {
          media.src = data.source;
          //media.addEventListener('canplay', function () {
          //media.play();
          //});
        }
      } else {
        $mediaElement.attr("src", data.source);
      }

      $mediaElement
        .css({
          top: data.top + "%",
          left: data.left + "%",
          width: data.width + "%",
          height: data.height + "%",
        })
        .hide();

      data.element = $mediaElement;

      data.timeout = null;

      const that = this;

      data.checkForStall = function () {
        const self = this;

        if (this.active) {
          that._checkMediaSynchronization();
          if (this.element.get(0).readyState > 0 && !this.outOfSync) {
            that._playbackStalled(false, self);
          } else {
            that._playbackStalled(true, self);
            if (this.timeout) {
              window.clearTimeout(this.timeout);
            }
            this.timeout = window.setTimeout(function () {
              self.checkForStall();
            }, 1000);
          }
        } else {
          that._playbackStalled(false, self);
        }
      };

      this._contentAnnotations.push(data);

      if (this.$playerElement) {
        this._$canvasContainer.append($mediaElement);
      }

      $mediaElement.on("loadedmetadata", () => {
        this._readyMediaCount++;

        if (this._readyMediaCount === this._contentAnnotations.length) {
          if (this._data.autoPlay) {
            this.play();
          } else {
            this.pause();
          }

          this._updateDurationDisplay();

          this.fire(Events.MEDIA_READY);
        }
      });

      $mediaElement.attr("preload", "metadata");

      // @todo why?
      (<any>$mediaElement.get(0)).load();

      this._renderSyncIndicator(data);
    }

    private _getWaveformData(url: string): Promise<any> {
      // return new Promise(function (resolve, reject) {
      //     const xhr = new XMLHttpRequest();
      //     xhr.responseType = 'arraybuffer';
      //     xhr.open('GET', url);
      //     xhr.addEventListener('load', (progressEvent: any) => {
      //         if (xhr.status == 200) {
      //             resolve(WaveformData.create(progressEvent.target.response));
      //         } else {
      //             reject(new Error(xhr.statusText));
      //         }
      //     });
      //     xhr.onerror = function () {
      //         reject(new Error("Network Error"));
      //     };
      //     xhr.send();
      // });

      // must use this for IE11
      return new Promise(function (resolve, reject) {
        $.ajax(<any>{
          url: url,
          type: "GET",
          dataType: "binary",
          responseType: "arraybuffer",
          processData: false,
        })
          .done(function (data) {
            resolve(WaveformData.create(data));
          })
          .fail(function (err) {
            reject(new Error("Network Error"));
          });
      });
    }

    private waveformDeltaX = 0;
    private waveformPageX = 0;
    private waveFormInit = false;

    private _renderWaveform(forceRender = false): void {
      if (this.waveFormInit && !forceRender) {
        return;
      }
      this.waveFormInit = true;

      if (!this.waveforms.length) return;

      const promises = this.waveforms.map((url) => {
        return this._getWaveformData(url);
      });

      Promise.all(promises)
        .then((waveforms) => {
          this._waveformCanvas = document.createElement("canvas");
          this._waveformCanvas.classList.add("waveform");
          this._$canvasContainer.append(this._waveformCanvas);
          this.waveformPageX = this._waveformCanvas.getBoundingClientRect().left;
          const raf = this._drawWaveform.bind(this);

          // Mouse in and out we reset the delta
          this._waveformCanvas.addEventListener("mousein", () => {
            this.waveformDeltaX = 0;
          });
          this._$canvasTimelineContainer.on("mouseout", () => {
            this.waveformDeltaX = 0;
            requestAnimationFrame(raf);
          });
          this._waveformCanvas.addEventListener("mouseout", () => {
            this.waveformDeltaX = 0;
            requestAnimationFrame(raf);
          });

          // When mouse moves over waveform, we render
          this._waveformCanvas.addEventListener("mousemove", (e) => {
            this.waveformDeltaX = e.clientX - this.waveformPageX;
            requestAnimationFrame(raf);
          });
          this._$canvasTimelineContainer.on("mousemove", (e) => {
            this.waveformDeltaX = e.clientX - this.waveformPageX;
            requestAnimationFrame(raf);
          });

          // When we click the waveform, it should navigate
          this._waveformCanvas.addEventListener("click", () => {
            const width =
              this._waveformCanvas!.getBoundingClientRect().width || 0;
            if (width) {
              const { start, duration } = this.getRangeTiming();
              this._setCurrentTime(
                start + duration * (this.waveformDeltaX / width)
              );
            }
          });

          this._waveformCtx = this._waveformCanvas.getContext("2d");

          if (this._waveformCtx) {
            this._waveformCtx.fillStyle = <string>this._data.waveformColor;
            this._compositeWaveform = new CompositeWaveform(waveforms);
            this.fire(Events.WAVEFORM_READY);
          }
        })
        .catch(() => {
          console.warn("Could not load wave forms.");
        });
    }

    private getRangeTiming(): {
      start: number;
      end: number;
      duration: number;
      percent: number;
    } {
      if (AVComponent.newRanges && this.isVirtual()) {
        return {
          start: this.timePlanPlayer.plan.start,
          end: this.timePlanPlayer.plan.end,
          duration: this.timePlanPlayer.plan.duration,
          percent: Math.min(
            (this.timePlanPlayer.getTime() - this.timePlanPlayer.plan.start) /
              this.timePlanPlayer.plan.duration,
            1
          ),
        };
      }

      let durationObj: Manifesto.Duration | undefined;
      let start = 0;
      let end = this._compositeWaveform ? this._compositeWaveform.duration : -1;
      let duration = end;

      // This is very similar to
      if (this._data.range) {
        durationObj = this._data.range.getDuration();
      }

      if (!this.isVirtual()) {
        end = this._getDuration();
      }

      if (this._data.limitToRange && durationObj) {
        start = durationObj.start;
        end = durationObj.end;
        duration = end - start;
      }

      if (end === -1 && durationObj) {
        start = durationObj.start;
        end = durationObj.end;
        duration = end - start;
      }

      if (end === -1) {
        console.log("getRangeTiming", { start, end, duration, durationObj });
        console.log("Duration not found...");
      }

      return {
        start,
        end,
        duration: end - start,
        percent: Math.min((this.getClockTime() - start) / duration, 1),
      };
    }

    private _drawWaveform(): void {
      this._renderWaveform();

      //if (!this._waveformCtx || !this._waveformNeedsRedraw) return;
      if (!this._waveformCtx || !this.isVisible()) return;

      const { start, end, percent } = this.getRangeTiming();
      const startpx = start * this._compositeWaveform.pixelsPerSecond;
      const endpx = end * this._compositeWaveform.pixelsPerSecond;
      const canvasWidth: number = this._waveformCtx.canvas.width;
      const canvasHeight: number = this._waveformCtx.canvas.height;
      const barSpacing: number = <number>this._data.waveformBarSpacing;
      const barWidth: number = <number>this._data.waveformBarWidth;
      const increment: number = Math.floor(
        ((endpx - startpx) / canvasWidth) * barSpacing
      );
      const sampleSpacing: number = canvasWidth / barSpacing;

      this._waveformCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      this._waveformCtx.fillStyle = <string>this._data.waveformColor;

      var inc = canvasWidth / (end - start);
      const listOfBuffers: Array<[number, number]> = [];

      if (this._contentAnnotations) {
        for (let i = 0; i < this._contentAnnotations.length; i++) {
          const contentAnnotation = this._contentAnnotations[i];
          if (contentAnnotation && contentAnnotation.element) {
            const element: HTMLAudioElement = contentAnnotation.element[0];
            const annoStart: number = contentAnnotation.startOffest || 0;
            const active: boolean = contentAnnotation.active;
            if (active) {
              for (let i = 0; i < element.buffered.length; i++) {
                const reverse = element.buffered.length - i - 1;
                const startX = element.buffered.start(reverse);
                const endX = element.buffered.end(reverse);
                listOfBuffers.push([
                  (annoStart + startX - start) * inc,
                  (annoStart + endX - start) * inc,
                ]);
              }
            }
          }
        }
      }

      const newList: any[] = [];

      if (this.isVirtual() && AVComponent.newRanges) {
        const plan = this.timePlanPlayer.plan;

        const compositeCanvas = this._data.canvas as VirtualCanvas;
        for (const stop of plan.stops) {
          const map =
            compositeCanvas.durationMap[plan.canvases[stop.canvasIndex]];
          const canvasEndTime = map.runningDuration;
          const canvasStartTime = canvasEndTime - map.duration;

          // Start percentage.
          // End percentage.

          newList.push({
            start: (stop.start - plan.start) / plan.duration,
            end: (stop.end - plan.start) / plan.duration,
            duration: stop.duration,
            startTime: canvasStartTime + stop.canvasTime.start,
            endTime:
              canvasStartTime + stop.canvasTime.start + stop.canvasTime.end,
          });
        }
      } else {
        newList.push({
          start: 0,
          duration: end - start,
          end,
          startTime: start,
        });
      }

      // console.log('new list', newList);

      let current = 0;
      for (let x = startpx; x < endpx; x += increment) {
        const rangePercentage = AVComponentUtils.normalise(x, startpx, endpx);
        const xpos = rangePercentage * canvasWidth;
        if (newList[current].end < rangePercentage) {
          current++;
        }
        const section: { start: number; startTime: number; duration: number } =
          newList[current];

        // range percent 0..1
        // section.start = 1.73
        // section.duration = 1806
        // section.startTime = 1382
        // section.endTime = 5003
        //
        // What I need
        // - time in seconds for the current increment
        // startTime + (0) - the first will always be the start time.
        // startTime + ( rangePercentage *  )

        const partPercent = rangePercentage - section.start;
        const toSample = Math.floor(
          (section.startTime + partPercent * section.duration) *
            this._compositeWaveform.pixelsPerSecond
        );

        // console.log('sample seconds -> ', { sample: toSample/60, partPercent, rangePercentage })

        const maxMin = this._getWaveformMaxAndMin(
          this._compositeWaveform,
          toSample,
          sampleSpacing
        );
        const height = this._scaleY(maxMin.max - maxMin.min, canvasHeight);
        const pastCurrentTime = xpos / canvasWidth < percent;
        const hoverWidth = this.waveformDeltaX / canvasWidth;
        let colour = <string>this._data.waveformColor;
        const ypos = (canvasHeight - height) / 2;

        if (pastCurrentTime) {
          if (this.waveformDeltaX === 0) {
            // ======o_____
            //   ^ this colour, no hover
            colour = "#14A4C3";
          } else if (xpos / canvasWidth < hoverWidth) {
            // ======T---o_____
            //    ^ this colour
            colour = "#11758e"; // dark
          } else {
            // ======T---o_____
            //         ^ this colour
            colour = "#14A4C3"; // normal
          }
        } else if (xpos / canvasWidth < hoverWidth) {
          // ======o-------T_____
          //           ^ this colour
          colour = "#86b3c3"; // lighter
        } else {
          colour = "#8a9aa1";
          for (const [a, b] of listOfBuffers) {
            if (xpos > a && xpos < b) {
              colour = "#fff";
              break;
            }
          }
        }

        this._waveformCtx.fillStyle = colour;
        this._waveformCtx.fillRect(xpos, ypos, barWidth, height | 0);
      }

      return;
      //
      //
      //             // let i = 0;
      //             for (const [innerStartPx, innerEndPx, innerIncr, sectionWidth, offsetX] of startEndList) {
      //                 for (let x = innerStartPx; x < innerEndPx; x += innerIncr) {
      //                     const maxMin = this._getWaveformMaxAndMin(this._compositeWaveform, x, sampleSpacing);
      //                     const height = this._scaleY(maxMin.max - maxMin.min, canvasHeight);
      //                     const ypos = (canvasHeight - height) / 2;
      //                     const xpos = offsetX + (sectionWidth * AVComponentUtils.normalise(x, innerStartPx, innerEndPx));
      //                     const pastCurrentTime = xpos / canvasWidth < percent;
      //                     const hoverWidth = this.waveformDeltaX / canvasWidth;
      //                     let colour = <string>this._data.waveformColor;
      //
      //                     // colour = ['#fff', 'red'][i % 2];
      //
      //                     // For colours.
      //                     // ======o-------T_____
      //                     //       ^ current time
      //                     // ======o-------T_____
      //                     //               ^ cursor
      //                     //
      //                     if (pastCurrentTime) {
      //                         if (this.waveformDeltaX === 0) {
      //                             // ======o_____
      //                             //   ^ this colour, no hover
      //                             colour = '#14A4C3';
      //                         } else if (xpos / canvasWidth < hoverWidth) {
      //                             // ======T---o_____
      //                             //    ^ this colour
      //                             colour = '#11758e'; // dark
      //                         } else {
      //                             // ======T---o_____
      //                             //         ^ this colour
      //                             colour = '#14A4C3'; // normal
      //                         }
      //                     } else if (xpos / canvasWidth < hoverWidth) {
      //                         // ======o-------T_____
      //                         //           ^ this colour
      //                         colour = '#86b3c3'; // lighter
      //                     } else {
      //                         colour = '#8a9aa1';
      //                         for (const [a, b] of listOfBuffers) {
      //                             if (xpos > a && xpos < b) {
      //                                 colour = '#fff';
      //                                 break;
      //                             }
      //                         }
      //                     }
      //
      //                     this._waveformCtx.fillStyle = colour;
      //                     this._waveformCtx.fillRect(xpos, ypos, barWidth, height | 0);
      //                 }
      //                 // i++;
      //             }
    }

    private _scaleY = (amplitude: number, height: number) => {
      const range = 256;
      return Math.max(
        <number>this._data.waveformBarWidth,
        (amplitude * height) / range
      );
    };

    private _getWaveformMaxAndMin(
      waveform: CompositeWaveform,
      index: number,
      sampleSpacing: number
    ): IMaxMin {
      let max: number = -127;
      let min: number = 128;

      for (let x = index; x < index + sampleSpacing; x++) {
        const wMax = waveform.max(x);
        const wMin = waveform.min(x);

        if (wMax > max) {
          max = wMax;
        }

        if (wMin < min) {
          min = wMin;
        }
      }

      return { max, min };
    }

    public isLimitedToRange() {
      return this._data.limitToRange;
    }

    public hasCurrentRange() {
      return !!this._data.range;
    }

    private _updateCurrentTimeDisplay(): void {
      if (AVComponent.newRanges && this.isVirtual()) {
        this._$canvasTime.text(
          AVComponentUtils.formatTime(
            this._canvasClockTime - this.timePlanPlayer.getStartTime()
          )
        );

        return;
      }

      let duration: Manifesto.Duration | undefined;

      if (this._data.range) {
        duration = this._data.range.getDuration();
      }

      if (this._data.limitToRange && duration) {
        const rangeClockTime: number = this._canvasClockTime - duration.start;
        this._$canvasTime.text(AVComponentUtils.formatTime(rangeClockTime));
      } else {
        this._$canvasTime.text(
          AVComponentUtils.formatTime(this._canvasClockTime)
        );
      }
    }

    private _updateDurationDisplay(): void {
      if (AVComponent.newRanges && this.isVirtual()) {
        this._$canvasDuration.text(
          AVComponentUtils.formatTime(this.timePlanPlayer.getDuration())
        );
        return;
      }

      let duration: Manifesto.Duration | undefined;

      if (this._data.range) {
        duration = this._data.range.getDuration();
      }

      if (this._data.limitToRange && duration) {
        this._$canvasDuration.text(
          AVComponentUtils.formatTime(duration.getLength())
        );
      } else {
        this._$canvasDuration.text(
          AVComponentUtils.formatTime(this._getDuration())
        );
      }
    }

    private _renderSyncIndicator(mediaElementData: any) {
      if (AVComponent.newRanges && this.isVirtual()) {
        console.log("_renderSyncIndicator");
        return;
      }

      const leftPercent: number = this._convertToPercentage(
        mediaElementData.start,
        this._getDuration()
      );
      const widthPercent: number = this._convertToPercentage(
        mediaElementData.end - mediaElementData.start,
        this._getDuration()
      );

      const $timelineItem: JQuery = $('<div class="timeline-item"></div>');

      $timelineItem.css({
        left: leftPercent + "%",
        width: widthPercent + "%",
      });

      const $lineWrapper: JQuery = $('<div class="line-wrapper"></div>');

      $timelineItem.appendTo($lineWrapper);

      mediaElementData.timelineElement = $timelineItem;

      if (this.$playerElement) {
        this._$timelineItemContainer.append($lineWrapper);
      }
    }

    public setCurrentTime(seconds: number): Promise<void> {
      console.log("External set current time?");
      return this._setCurrentTime(seconds, false);
    }

    private async _setCurrentTime(
      seconds: number,
      setRange: boolean = true
    ): Promise<void> {
      if (AVComponent.newRanges && this.isVirtual()) {
        this._buffering = true;
        await this.timePlanPlayer.setTime(seconds, setRange);
        this._buffering = false;
        this._canvasClockStartDate = Date.now() - this._canvasClockTime * 1000;
        this._canvasClockUpdater();
        this._highPriorityUpdater();
        this._lowPriorityUpdater();
        this._synchronizeMedia();
        return;
      }
      // seconds was originally a string or a number - didn't seem necessary
      // const secondsAsFloat: number = parseFloat(seconds.toString());

      // if (isNaN(secondsAsFloat)) {
      //     return;
      // }

      const { start, end } = this.getRangeTiming();
      if (seconds < start || start > end) {
        return;
      }
      this._canvasClockTime = seconds; //secondsAsFloat;
      this._canvasClockStartDate = Date.now() - this._canvasClockTime * 1000;

      this.logMessage(
        "SET CURRENT TIME to: " + this._canvasClockTime + " seconds."
      );

      this._canvasClockUpdater();
      this._highPriorityUpdater();
      this._lowPriorityUpdater();
      this._synchronizeMedia();
    }

    private _rewind(withoutUpdate?: boolean): void {
      if (AVComponent.newRanges && this.isVirtual()) {
        console.log("Rewind");
        return;
      }

      this.pause();

      let duration: Manifesto.Duration | undefined;

      if (this._data.range) {
        duration = this._data.range.getDuration();
      }

      if (this._data.limitToRange && duration) {
        this._setCurrentTime(duration.start);
      } else {
        this._setCurrentTime(0);
      }

      if (!this._data.limitToRange) {
        if (this._data && this._data.helper) {
          this.set({
            range: undefined,
          });
        }
      }
    }

    private _fastforward(): void {
      if (AVComponent.newRanges && this.isVirtual()) {
        console.log("Fast forward");
        return;
      }

      let duration: Manifesto.Duration | undefined;

      if (this._data.range) {
        duration = this._data.range.getDuration();
      }

      if (this._data.limitToRange && duration) {
        this._canvasClockTime = duration.end;
      } else {
        this._canvasClockTime = this._getDuration();
      }

      this.pause();
    }

    // todo: can this be part of the _data state?
    // this._data.play = true?
    public async play(withoutUpdate?: boolean): Promise<void> {
      if (this._isPlaying) return;

      if (AVComponent.newRanges && this.isVirtual()) {
        if (this.timePlanPlayer.hasEnded()) {
          this._buffering = true;
          await this.timePlanPlayer.setTime(
            this.timePlanPlayer.currentStop.start
          );
          this._buffering = false;
        }
        this.timePlanPlayer.play();
      } else {
        let duration: Manifesto.Duration | undefined;

        if (this._data.range) {
          duration = this._data.range.getDuration();
        }

        if (
          this._data.limitToRange &&
          duration &&
          this._canvasClockTime >= duration.end
        ) {
          this._canvasClockTime = duration.start;
        }

        if (this._canvasClockTime === this._getDuration()) {
          this._canvasClockTime = 0;
        }
      }

      this._canvasClockStartDate = Date.now() - this._canvasClockTime * 1000;

      if (this._highPriorityInterval) {
        clearInterval(this._highPriorityInterval);
      }
      this._highPriorityInterval = window.setInterval(() => {
        this._highPriorityUpdater();
      }, this._highPriorityFrequency);

      if (this._lowPriorityInterval) {
        clearInterval(this._lowPriorityInterval);
      }
      this._lowPriorityInterval = window.setInterval(() => {
        this._lowPriorityUpdater();
      }, this._lowPriorityFrequency);

      if (this._canvasClockInterval) {
        clearInterval(this._canvasClockInterval);
      }
      this._canvasClockInterval = window.setInterval(() => {
        this._canvasClockUpdater();
      }, this._canvasClockFrequency);

      this._isPlaying = true;

      if (!withoutUpdate) {
        this._synchronizeMedia();
      }

      const label: string =
        this._data && this._data.content ? this._data.content.pause : "";
      this._$playButton.prop("title", label);
      this._$playButton.find("i").switchClass("play", "pause");

      this.fire(CanvasInstanceEvents.PLAYCANVAS);
      this.logMessage("PLAY canvas");
    }

    // todo: can this be part of the _data state?
    // this._data.play = false?
    public pause(withoutUpdate?: boolean): void {
      window.clearInterval(this._highPriorityInterval);
      window.clearInterval(this._lowPriorityInterval);
      window.clearInterval(this._canvasClockInterval);

      this._isPlaying = false;

      if (!withoutUpdate) {
        this._highPriorityUpdater();
        this._lowPriorityUpdater();
        this._synchronizeMedia();
      }

      if (AVComponent.newRanges && this.isVirtual()) {
        this.timePlanPlayer.pause();
      }

      const label: string =
        this._data && this._data.content ? this._data.content.play : "";
      this._$playButton.prop("title", label);
      this._$playButton.find("i").switchClass("pause", "play");

      this.fire(CanvasInstanceEvents.PAUSECANVAS);
      this.logMessage("PAUSE canvas");
    }

    private _isNavigationConstrainedToRange(): boolean {
      return <boolean>this._data.constrainNavigationToRange;
    }

    private _canvasClockUpdater(): void {
      if (AVComponent.newRanges && this.isVirtual()) {
        if (this._buffering) {
          return;
        }

        const { paused } = this.timePlanPlayer.advanceToTime(
          (Date.now() - this._canvasClockStartDate) / 1000
        );
        if (paused) {
          this.pause();
        }

        // console.log('_canvasClockUpdater');
        return;
      }
      if (this._buffering) {
        return;
      }
      this._canvasClockTime = (Date.now() - this._canvasClockStartDate) / 1000;

      let duration: Manifesto.Duration | undefined;

      if (this._data.range) {
        duration = this._data.range.getDuration();
      }

      if (
        this._data.limitToRange &&
        duration &&
        this._canvasClockTime >= duration.end
      ) {
        this.pause();
      }

      if (this._canvasClockTime >= this._getDuration()) {
        this._canvasClockTime = this._getDuration();
        this.pause();
      }
    }

    private _highPriorityUpdater(): void {
      if (this._bufferShown && !this._buffering) {
        this.$playerElement.removeClass("player--loading");
        this._bufferShown = false;
      }
      if (this._buffering && !this._bufferShown) {
        this.$playerElement.addClass("player--loading");
        this._bufferShown = true;
      }

      if (AVComponent.newRanges && this.isVirtual()) {
        this._$rangeTimelineContainer.slider({
          value: this._canvasClockTime - this.timePlanPlayer.plan.start,
        });

        this._$canvasTimelineContainer.slider({
          value: this._canvasClockTime - this.timePlanPlayer.plan.start,
        });
      } else {
        this._$rangeTimelineContainer.slider({
          value: this._canvasClockTime,
        });

        this._$canvasTimelineContainer.slider({
          value: this._canvasClockTime,
        });
      }

      this._updateCurrentTimeDisplay();
      this._updateDurationDisplay();
      this._drawWaveform();
    }

    private _lowPriorityUpdater(): void {
      this._updateMediaActiveStates();

      if (
        /*this._isPlaying && */ this._data.autoSelectRange &&
        (this.isVirtual() || this.isOnlyCanvasInstance)
      ) {
        this._hasRangeChanged();
      }
    }

    private _updateMediaActiveStates(): void {
      if (AVComponent.newRanges && this.isVirtual()) {
        if (this._isPlaying) {
          if (this.timePlanPlayer.isBuffering()) {
            this._buffering = true;
            return;
          } else if (this._buffering) {
            this._buffering = false;
          }
          this.timePlanPlayer.advanceToTime(this._canvasClockTime);
        }
        return;
      }

      let contentAnnotation;

      for (let i = 0; i < this._contentAnnotations.length; i++) {
        contentAnnotation = this._contentAnnotations[i];

        if (
          contentAnnotation.start <= this._canvasClockTime &&
          contentAnnotation.end >= this._canvasClockTime
        ) {
          this._checkMediaSynchronization();

          if (!contentAnnotation.active) {
            this._synchronizeMedia();
            contentAnnotation.active = true;
            contentAnnotation.element.show();
            contentAnnotation.timelineElement.addClass("active");
          }

          if (
            contentAnnotation.element[0].currentTime >
            contentAnnotation.element[0].duration - contentAnnotation.endOffset
          ) {
            this._pauseMedia(contentAnnotation.element[0]);
          }
        } else {
          if (contentAnnotation.active) {
            contentAnnotation.active = false;
            contentAnnotation.element.hide();
            contentAnnotation.timelineElement.removeClass("active");
            this._pauseMedia(contentAnnotation.element[0]);
          }
        }
      }

      //this.logMessage('UPDATE MEDIA ACTIVE STATES at: '+ this._canvasClockTime + ' seconds.');
    }

    private _pauseMedia(media: HTMLMediaElement): void {
      media.pause();

      // const playPromise = media.play();

      // if (playPromise !== undefined) {
      //     playPromise.then(_ => {
      //         // https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
      //         media.pause();
      //     });
      // } else {
      //     media.pause();
      // }
    }

    private _setMediaCurrentTime(media: HTMLMediaElement, time: number): void {
      if (!isNaN(media.duration)) {
        media.currentTime = time;
      }
    }

    private _synchronizeMedia(): void {
      if (AVComponent.newRanges && this.isVirtual()) {
        // console.log('_synchronizeMedia', this.timePlanPlayer.isBuffering());
        return;
      }

      let contentAnnotation;

      for (let i = 0; i < this._contentAnnotations.length; i++) {
        contentAnnotation = this._contentAnnotations[i];

        this._setMediaCurrentTime(
          contentAnnotation.element[0],
          this._canvasClockTime -
            contentAnnotation.start +
            contentAnnotation.startOffset
        );

        if (
          contentAnnotation.start <= this._canvasClockTime &&
          contentAnnotation.end >= this._canvasClockTime
        ) {
          if (this._isPlaying) {
            if (contentAnnotation.element[0].paused) {
              const promise = contentAnnotation.element[0].play();
              if (promise) {
                promise.catch(function () {});
              }
            }
          } else {
            this._pauseMedia(contentAnnotation.element[0]);
          }
        } else {
          this._pauseMedia(contentAnnotation.element[0]);
        }

        if (
          contentAnnotation.element[0].currentTime >
          contentAnnotation.element[0].duration - contentAnnotation.endOffset
        ) {
          this._pauseMedia(contentAnnotation.element[0]);
        }
      }

      this.logMessage("SYNC MEDIA at: " + this._canvasClockTime + " seconds.");
    }

    private _checkMediaSynchronization(): void {
      if (AVComponent.newRanges && this.isVirtual()) {
        if (this._isPlaying) {
          if (this.timePlanPlayer.isBuffering()) {
            this._buffering = true;
          } else if (this._buffering) {
            this._buffering = false;
          }
        }

        return;
      }

      let contentAnnotation;

      for (let i = 0, l = this._contentAnnotations.length; i < l; i++) {
        contentAnnotation = this._contentAnnotations[i];

        if (
          contentAnnotation.start <= this._canvasClockTime &&
          contentAnnotation.end >= this._canvasClockTime
        ) {
          if (this._isPlaying) {
            if (contentAnnotation.element[0].readyState < 3) {
              this._buffering = true;
            } else if (this._buffering) {
              this._buffering = false;
            }
          }

          const correctTime: number =
            this._canvasClockTime -
            contentAnnotation.start +
            contentAnnotation.startOffset;
          const factualTime: number = contentAnnotation.element[0].currentTime;

          // off by 0.2 seconds
          if (Math.abs(factualTime - correctTime) > this._mediaSyncMarginSecs) {
            contentAnnotation.outOfSync = true;
            //this.playbackStalled(true, contentAnnotation);

            const lag: number = Math.abs(factualTime - correctTime);
            this.logMessage("DETECTED synchronization lag: " + Math.abs(lag));
            this._setMediaCurrentTime(
              contentAnnotation.element[0],
              correctTime
            );
            //this.synchronizeMedia();
          } else {
            contentAnnotation.outOfSync = false;
            //this.playbackStalled(false, contentAnnotation);
          }
        }
      }
    }

    private _playbackStalled(
      aBoolean: boolean,
      syncMediaRequestingStall: any
    ): void {
      if (aBoolean) {
        if (this._stallRequestedBy.indexOf(syncMediaRequestingStall) < 0) {
          this._stallRequestedBy.push(syncMediaRequestingStall);
        }

        if (!this._isStalled) {
          if (this.$playerElement) {
            //this._showWorkingIndicator(this._$canvasContainer);
          }

          this._wasPlaying = this._isPlaying;
          this.pause(true);
          this._isStalled = aBoolean;
        }
      } else {
        const idx: number = this._stallRequestedBy.indexOf(
          syncMediaRequestingStall
        );

        if (idx >= 0) {
          this._stallRequestedBy.splice(idx, 1);
        }

        if (this._stallRequestedBy.length === 0) {
          //this._hideWorkingIndicator();

          if (this._isStalled && this._wasPlaying) {
            this.play(true);
          }

          this._isStalled = aBoolean;
        }
      }
    }

    public resize(): void {
      if (this.$playerElement) {
        const containerWidth:
          | number
          | undefined = this._$canvasContainer.width();

        if (containerWidth) {
          this._$canvasTimelineContainer.width(containerWidth);

          //const resizeFactorY: number = containerWidth / this.canvasWidth;
          //$canvasContainer.height(this.canvasHeight * resizeFactorY);

          const $options: JQuery = this.$playerElement.find(
            ".options-container"
          );

          // if in the watch metric, make sure the canvasContainer isn't more than half the height to allow
          // room between buttons
          if (
            this._data.halveAtWidth !== undefined &&
            <number>this.$playerElement.parent().width() <
              this._data.halveAtWidth
          ) {
            this._$canvasContainer.height(
              <number>this.$playerElement.parent().height() / 2
            );
          } else {
            this._$canvasContainer.height(
              <number>this.$playerElement.parent().height() -
                <number>$options.height()
            );
          }
        }

        if (this._waveformCanvas) {
          const canvasWidth: number = <number>this._$canvasContainer.width();
          const canvasHeight: number = <number>this._$canvasContainer.height();

          this._waveformCanvas.width = canvasWidth;
          this._waveformCanvas.height = canvasHeight;
          this.waveformPageX = this._waveformCanvas.getBoundingClientRect().left;
        }

        this._render();
        this._drawWaveform();
      }
    }
  }

  export class CanvasInstanceEvents {
    static NEXT_RANGE: string = "nextrange";
    static PAUSECANVAS: string = "pause";
    static PLAYCANVAS: string = "play";
    static PREVIOUS_RANGE: string = "previousrange";
  }

  export class CompositeWaveform {
    private _waveforms: Waveform[];
    public length: number = 0;
    public duration: number = 0;
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
      if (typeof this.minIndex[index] === "undefined") {
        const waveform = this._find(index);
        this.minIndex[index] = waveform
          ? waveform.waveform.min_sample(index - waveform.start)
          : 0;
      }
      return this.minIndex[index];
    }

    max(index: number) {
      if (typeof this.maxIndex[index] === "undefined") {
        const waveform = this._find(index);
        this.maxIndex[index] = waveform
          ? waveform.waveform.max_sample(index - waveform.start)
          : 0;
      }
      return this.maxIndex[index];
    }

    _find(index: number) {
      if (typeof this.timeIndex[index] === "undefined") {
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

  export class AVComponentUtils {
    private static _compare(a: any, b: any): string[] {
      const changed: string[] = [];
      Object.keys(a).forEach((p) => {
        if (!Object.is(b[p], a[p])) {
          changed.push(p);
        }
      });
      return changed;
    }

    public static diff(a: any, b: any) {
      return Array.from(
        new Set(
          AVComponentUtils._compare(a, b).concat(
            AVComponentUtils._compare(b, a)
          )
        )
      );
    }

    public static getSpatialComponent(target: string): number[] | null {
      const spatial: RegExpExecArray | null = /xywh=([^&]+)/g.exec(target);
      let xywh: number[] | null = null;

      if (spatial && spatial[1]) {
        xywh = <any>spatial[1].split(",");
      }

      return xywh;
    }

    public static getFirstTargetedCanvasId(
      range: Manifesto.Range
    ): string | undefined {
      let canvasId: string | undefined;

      if (range.canvases && range.canvases.length) {
        canvasId = range.canvases[0];
      } else {
        const childRanges: Manifesto.Range[] = range.getRanges();

        if (childRanges.length) {
          return AVComponentUtils.getFirstTargetedCanvasId(childRanges[0]);
        }
      }

      if (canvasId !== undefined) {
        return Manifesto.Utils.normaliseUrl(canvasId);
      }

      return undefined;
    }

    public static getTimestamp(): string {
      return String(new Date().valueOf());
    }

    public static retargetTemporalComponent(
      canvases: Manifesto.Canvas[],
      target: string
    ): string | undefined {
      let t: number[] | null = Manifesto.Utils.getTemporalComponent(target);

      if (t) {
        let offset: number = 0;
        let targetWithoutTemporal: string = target.substr(
          0,
          target.indexOf("#")
        );

        // loop through canvases adding up their durations until we reach the targeted canvas
        for (let i = 0; i < canvases.length; i++) {
          const canvas: Manifesto.Canvas = canvases[i];
          if (!canvas.id.includes(targetWithoutTemporal)) {
            const duration: number | null = canvas.getDuration();
            if (duration) {
              offset += duration;
            }
          } else {
            // we've reached the canvas whose target we're adjusting
            break;
          }
        }

        t[0] = Number(t[0]) + offset;
        t[1] = Number(t[1]) + offset;

        return targetWithoutTemporal + "#t=" + t[0] + "," + t[1];
      }

      return undefined;
    }

    public static formatTime(aNumber: number): string {
      let hours: number | string,
        minutes: number | string,
        seconds: number | string,
        hourValue: string;

      seconds = Math.ceil(aNumber);
      hours = Math.floor(seconds / (60 * 60));
      hours = hours >= 10 ? hours : "0" + hours;
      minutes = Math.floor((seconds % (60 * 60)) / 60);
      minutes = minutes >= 10 ? minutes : "0" + minutes;
      seconds = Math.floor((seconds % (60 * 60)) % 60);
      seconds = seconds >= 10 ? seconds : "0" + seconds;

      if (hours >= 1) {
        hourValue = hours + ":";
      } else {
        hourValue = "";
      }

      return hourValue + minutes + ":" + seconds;
    }

    public static isIE(): number | boolean {
      const ua = window.navigator.userAgent;

      // Test values; Uncomment to check result …

      // IE 10
      // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

      // IE 11
      // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

      // Edge 12 (Spartan)
      // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';

      // Edge 13
      // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';

      const msie = ua.indexOf("MSIE ");
      if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)), 10);
      }

      const trident = ua.indexOf("Trident/");
      if (trident > 0) {
        // IE 11 => return version number
        const rv = ua.indexOf("rv:");
        return parseInt(ua.substring(rv + 3, ua.indexOf(".", rv)), 10);
      }

      const edge = ua.indexOf("Edge/");
      if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf(".", edge)), 10);
      }

      // other browser
      return false;
    }

    public static isSafari(): boolean {
      // https://stackoverflow.com/questions/7944460/detect-safari-browser?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
      return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    public static debounce(fn: any, debounceDuration: number): any {
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
          const args: any = Array.prototype.slice.apply(arguments);
          fn.lastReturnVal = fn.apply(window, args);
          fn.debouncing = true;
        }
        clearTimeout(fn.debounceTimeout);
        fn.debounceTimeout = setTimeout(function () {
          fn.debouncing = false;
        }, debounceDuration);

        return fn.lastReturnVal;
      };
    }

    public static hlsMimeTypes = [
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
      "application/mpegurl",
    ];

    public static normalise(num: number, min: number, max: number): number {
      return (num - min) / (max - min);
    }

    public static isHLSFormat(format: MediaType) {
      return this.hlsMimeTypes.includes(format.toString());
    }

    public static isMpegDashFormat(format: MediaType) {
      return format.toString() === "application/dash+xml";
    }

    public static canPlayHls() {
      var doc = typeof document === "object" && document,
        videoelem = doc && doc.createElement("video"),
        isvideosupport = Boolean(videoelem && videoelem.canPlayType);

      return (
        isvideosupport &&
        this.hlsMimeTypes.some(function (canItPlay) {
          return /maybe|probably/i.test(
            (<any>videoelem).canPlayType(canItPlay)
          );
        })
      );
    }
  }

  // @todo - change for time-slicing, or add new types of virtual canvas
  export class VirtualCanvas {
    public canvases: Manifesto.Canvas[] = [];
    public id: string;

    public durationMap: {
      [id: string]: {
        duration: number;
        runningDuration: number;
      };
    } = {};
    public totalDuration: number = 0;

    constructor() {
      // generate an id
      this.id = AVComponentUtils.getTimestamp();
    }

    public addCanvas(canvas: Manifesto.Canvas): void {
      // canvases need to be deep copied including functions
      this.canvases.push(jQuery.extend(true, {}, canvas));
      const duration = canvas.getDuration() || 0;
      this.totalDuration += duration;
      this.durationMap[canvas.id] = {
        duration: duration,
        runningDuration: this.totalDuration,
      };
    }

    public getContent(): Manifesto.Annotation[] {
      const annotations: Manifesto.Annotation[] = [];

      this.canvases.forEach((canvas: Manifesto.Canvas) => {
        const items: Manifesto.Annotation[] = canvas.getContent();

        // if the annotations have no temporal target, add one so that
        // they specifically target the duration of their canvas
        items.forEach((item: Manifesto.Annotation) => {
          const target: string | null = item.getTarget();

          if (target) {
            let t: number[] | null = Manifesto.Utils.getTemporalComponent(
              target
            );
            if (!t) {
              item.__jsonld.target += "#t=0," + canvas.getDuration();
            }
          }
        });

        items.forEach((item: Manifesto.Annotation) => {
          const target: string | null = item.getTarget();

          if (target) {
            item.__jsonld.target = AVComponentUtils.retargetTemporalComponent(
              this.canvases,
              target
            );
          }
        });

        annotations.push(...items);
      });

      return annotations;
    }

    getDuration(): number | null {
      let duration: number = 0;

      this.canvases.forEach((canvas: Manifesto.Canvas) => {
        const d: number | null = canvas.getDuration();
        if (d) {
          duration += d;
        }
      });

      return Math.floor(duration);
    }

    getWidth(): number {
      if (this.canvases.length) {
        return this.canvases[0].getWidth();
      }
      return 0;
    }

    getHeight(): number {
      if (this.canvases.length) {
        return this.canvases[0].getHeight();
      }
      return 0;
    }
  }

  export class Waveform {
    public start: number;
    public end: number;
    public waveform: any;
  }

  export class AVComponent extends _Components.BaseComponent {
    static newRanges = true;
    private _data: IAVComponentData = this.data();
    public options: _Components.IBaseComponentOptions;
    public canvasInstances: CanvasInstance[] = [];
    private _checkAllMediaReadyInterval: any;
    private _checkAllWaveformsReadyInterval: any;
    private _readyMedia: number = 0;
    private _readyWaveforms: number = 0;
    private _posterCanvasWidth: number = 0;
    private _posterCanvasHeight: number = 0;

    private _$posterContainer: JQuery;
    private _$posterImage: JQuery;
    private _$posterExpandButton: JQuery;

    private _posterImageExpanded: boolean = false;

    constructor(options: _Components.IBaseComponentOptions) {
      super(options);

      this._init();
      this._resize();
    }

    protected _init(): boolean {
      const success: boolean = super._init();

      if (!success) {
        console.error("Component failed to initialise");
      }

      return success;
    }

    public getCurrentCanvasInstance(): Manifesto.Canvas | null {
      const range = this._data.helper!.getRangeById(this._data.range.id);
      if (!range) {
        return null;
      }
      const canvasId:
        | string
        | undefined = AVComponentUtils.getFirstTargetedCanvasId(range);

      return canvasId ? this._data.helper!.getCanvasById(canvasId) : null;
    }

    public data(): IAVComponentData {
      return <IAVComponentData>{
        autoPlay: false,
        constrainNavigationToRange: false,
        defaultAspectRatio: 0.56,
        doubleClickMS: 350,
        halveAtWidth: 200,
        limitToRange: false,
        posterImageRatio: 0.3,
        virtualCanvasEnabled: true,
        content: <IAVComponentContent>{
          currentTime: "Current Time",
          collapse: "Collapse",
          duration: "Duration",
          expand: "Expand",
          mute: "Mute",
          next: "Next",
          pause: "Pause",
          play: "Play",
          previous: "Previous",
          unmute: "Unmute",
        },
        enableFastForward: true,
        enableFastRewind: true,
      };
    }

    public set(data: IAVComponentData): void {
      console.groupCollapsed("Setting AV Component");
      console.log("Data");

      const oldData: IAVComponentData = Object.assign({}, this._data);
      this._data = Object.assign(this._data, data);
      const diff: string[] = AVComponentUtils.diff(oldData, this._data);

      // changing any of these data properties forces a reload.
      if (diff.includes("helper")) {
        // create canvases
        this._reset();
      }

      if (!this._data.helper) {
        console.warn("must pass a helper object");
        return;
      }

      this.canvasInstances.forEach(
        (canvasInstance: CanvasInstance, index: number) => {
          const toSet: any = {};

          if (diff.includes("limitToRange") && this._data.canvasId) {
            toSet.limitToRange = this._data.limitToRange;
          }

          if (
            diff.includes("constrainNavigationToRange") &&
            this._data.canvasId
          ) {
            toSet.constrainNavigationToRange = this._data.constrainNavigationToRange;
          }

          if (diff.includes("autoSelectRange") && this._data.canvasId) {
            toSet.autoSelectRange = this._data.autoSelectRange;
          }

          canvasInstance.set(toSet);
        }
      );

      if (
        (diff.includes("virtualCanvasEnabled") || diff.includes("canvasId")) &&
        this._data.canvasId
      ) {
        const nextCanvasInstance:
          | CanvasInstance
          | undefined = this._getCanvasInstanceById(this._data.canvasId);

        if (nextCanvasInstance) {
          this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
            // hide canvases that don't have the same id
            if (
              canvasInstance.getCanvasId() !== nextCanvasInstance.getCanvasId()
            ) {
              canvasInstance.set({
                visible: false,
              });
            } else {
              if (diff.includes("range")) {
                canvasInstance.set({
                  visible: true,
                  range: this._data.range
                    ? jQuery.extend(true, {}, this._data.range)
                    : undefined,
                });
              } else {
                canvasInstance.set({
                  visible: true,
                });
              }
            }
          });
        }
      }

      if (diff.includes("virtualCanvasEnabled")) {
        this.set({
          range: undefined,
        });

        // as you don't know the id of virtual canvases, you can toggle them on
        // but when toggling off, you must call showCanvas to show the next canvas
        if (this._data.virtualCanvasEnabled) {
          this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
            if (canvasInstance.isVirtual()) {
              this.set({
                canvasId: canvasInstance.getCanvasId(),
                range: undefined,
              });
            }
          });
        }
      }

      if (diff.includes("range") && this._data.range) {
        let range: Manifesto.Range | null = this._data.helper.getRangeById(
          this._data.range.id
        );

        if (!range) {
          console.warn("range not found");
        } else {
          let canvasId:
            | string
            | undefined = AVComponentUtils.getFirstTargetedCanvasId(range);

          if (canvasId) {
            // get canvas by normalised id (without temporal part)
            const canvasInstance:
              | CanvasInstance
              | undefined = this._getCanvasInstanceById(canvasId);

            if (canvasInstance) {
              if (
                canvasInstance.isVirtual() &&
                this._data.virtualCanvasEnabled
              ) {
                if (canvasInstance.includesVirtualSubCanvas(canvasId)) {
                  canvasId = canvasInstance.getCanvasId();

                  // use the retargeted range
                  for (let i = 0; i < canvasInstance.ranges.length; i++) {
                    const r: Manifesto.Range = canvasInstance.ranges[i];

                    if (r.id === range.id) {
                      range = r;
                      break;
                    }
                  }
                }
              }

              // if not using the correct canvasinstance, switch to it
              if (
                this._data.canvasId &&
                (this._data.canvasId.includes("://")
                  ? Manifesto.Utils.normaliseUrl(this._data.canvasId)
                  : this._data.canvasId) !== canvasId
              ) {
                this.set({
                  canvasId: canvasId,
                  range: jQuery.extend(true, {}, range), // force diff
                });
              } else {
                canvasInstance.set({
                  range: jQuery.extend(true, {}, range),
                });
              }
            }
          }
        }
      }

      this._render();
      this._resize();
      console.groupEnd();
    }

    private _render(): void {}

    public reset(): void {
      this._reset();
    }

    private _reset(): void {
      this._readyMedia = 0;
      this._readyWaveforms = 0;
      this._posterCanvasWidth = 0;
      this._posterCanvasHeight = 0;

      clearInterval(this._checkAllMediaReadyInterval);
      clearInterval(this._checkAllWaveformsReadyInterval);

      this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
        canvasInstance.destroy();
      });

      this.canvasInstances = [];

      this._$element.empty();

      if (this._data && this._data.helper && this._data.helper.manifest) {
        // if the manifest has an auto-advance behavior, join the canvases into a single "virtual" canvas
        const behavior: Behavior | null = this._data.helper.manifest.getBehavior();
        const canvases: Manifesto.Canvas[] = this._getCanvases();

        if (
          behavior &&
          behavior.toString() === 'auto-advance'
        ) {
          // @todo - use time-slices to create many virtual canvases with support for sliced canvases with start and end times.

          const virtualCanvas: VirtualCanvas = new VirtualCanvas();

          canvases.forEach((canvas: Manifesto.Canvas) => {
            virtualCanvas.addCanvas(canvas);
          });

          this._initCanvas(virtualCanvas);
        }

        // all canvases need to be individually navigable
        canvases.forEach((canvas: Manifesto.Canvas) => {
          this._initCanvas(canvas);
        });

        if (this.canvasInstances.length > 0) {
          this._data.canvasId = <string>this.canvasInstances[0].getCanvasId();
        }

        this._checkAllMediaReadyInterval = setInterval(
          this._checkAllMediaReady.bind(this),
          100
        );
        this._checkAllWaveformsReadyInterval = setInterval(
          this._checkAllWaveformsReady.bind(this),
          100
        );

        this._$posterContainer = $('<div class="poster-container"></div>');
        this._$element.append(this._$posterContainer);

        this._$posterImage = $('<div class="poster-image"></div>');
        this._$posterExpandButton = $(`
                    <button class="btn" title="${
                      this._data && this._data.content
                        ? this._data.content.expand
                        : ""
                    }">
                        <i class="av-icon  av-icon-expand expand" aria-hidden="true"></i><span>${
                          this._data && this._data.content
                            ? this._data.content.expand
                            : ""
                        }</span>
                    </button>
                `);
        this._$posterImage.append(this._$posterExpandButton);

        this._$posterImage.on("touchstart click", (e) => {
          e.preventDefault();

          const target: any = this._getPosterImageCss(
            !this._posterImageExpanded
          );
          //this._$posterImage.animate(target,"fast", "easein");
          this._$posterImage.animate(target);
          this._posterImageExpanded = !this._posterImageExpanded;

          if (this._data.content) {
            if (this._posterImageExpanded) {
              const label: string = this._data.content.collapse;
              this._$posterExpandButton.prop("title", label);
              this._$posterExpandButton
                .find("i")
                .switchClass("expand", "collapse");
            } else {
              const label: string = this._data.content.expand;
              this._$posterExpandButton.prop("title", label);
              this._$posterExpandButton
                .find("i")
                .switchClass("collapse", "expand");
            }
          }
        });

        // poster canvas
        const posterCanvas: Manifesto.Canvas | null = this._data.helper.getPosterCanvas();

        if (posterCanvas) {
          this._posterCanvasWidth = posterCanvas.getWidth();
          this._posterCanvasHeight = posterCanvas.getHeight();

          const posterImage: string | null = this._data.helper.getPosterImage();

          if (posterImage) {
            this._$posterContainer.append(this._$posterImage);

            let css: any = this._getPosterImageCss(this._posterImageExpanded);
            css = Object.assign({}, css, {
              "background-image": "url(" + posterImage + ")",
            });

            this._$posterImage.css(css);
          }
        }
      }
    }

    public async setCurrentTime(time: number): Promise<void> {
      const canvas: CanvasInstance | undefined = this._getCurrentCanvas();
      if (canvas) {
        return canvas.setCurrentTime(time);
      }
      return;
    }

    public getCurrentTime(): number {
      const canvas: CanvasInstance | undefined = this._getCurrentCanvas();
      if (canvas) {
        return canvas.getClockTime();
      }
      return 0;
    }

    public isPlaying(): boolean {
      return this.canvasInstances.reduce(
        (isPlaying: boolean, next: CanvasInstance) => {
          return isPlaying || next.isPlaying();
        },
        false
      );
    }

    private _checkAllMediaReady(): void {
      if (this._readyMedia === this.canvasInstances.length) {
        clearInterval(this._checkAllMediaReadyInterval);
        this.fire(Events.MEDIA_READY);
        this.resize();
      }
    }

    private _checkAllWaveformsReady(): void {
      if (
        this._readyWaveforms === this._getCanvasInstancesWithWaveforms().length
      ) {
        clearInterval(this._checkAllWaveformsReadyInterval);
        this.fire(Events.WAVEFORMS_READY);
        this.resize();
      }
    }

    private _getCanvasInstancesWithWaveforms(): CanvasInstance[] {
      return this.canvasInstances.filter((c) => {
        return c.waveforms.length > 0;
      });
    }

    private _getCanvases(): Manifesto.Canvas[] {
      // @todo - figure out when this is used and if it needs time slicing considerations.
      if (this._data.helper) {
        return this._data.helper.getCanvases();
      }

      return [];
    }

    private _initCanvas(canvas: Manifesto.Canvas | VirtualCanvas): void {
      // @todo - change these events for time-slicing

      const canvasInstance: CanvasInstance = new CanvasInstance({
        target: document.createElement("div"),
        data: Object.assign({}, { canvas: canvas }, this._data),
      });

      canvasInstance.logMessage = this._logMessage.bind(this);
      canvasInstance.isOnlyCanvasInstance = this._getCanvases().length === 1;
      this._$element.append(canvasInstance.$playerElement);

      canvasInstance.init();
      this.canvasInstances.push(canvasInstance);

      canvasInstance.on(
        "play",
        () => {
          this.fire(Events.PLAY, canvasInstance);
        },
        false
      );

      canvasInstance.on(
        "pause",
        () => {
          this.fire(Events.PAUSE, canvasInstance);
        },
        false
      );

      canvasInstance.on(
        Events.MEDIA_READY,
        () => {
          this._readyMedia++;
          canvasInstance.loaded();
        },
        false
      );

      canvasInstance.on(
        Events.WAVEFORM_READY,
        () => {
          this._readyWaveforms++;
        },
        false
      );

      // canvasInstance.on(Events.RESETCANVAS, () => {
      //     this.playCanvas(canvasInstance.canvas.id);
      // }, false);

      canvasInstance.on(
        CanvasInstanceEvents.PREVIOUS_RANGE,
        () => {
          this._prevRange();
          this.play();
        },
        false
      );

      canvasInstance.on(
        CanvasInstanceEvents.NEXT_RANGE,
        () => {
          this._nextRange();
          this.play();
        },
        false
      );

      canvasInstance.on(
        Events.RANGE_CHANGED,
        (rangeId: string | null) => {
          this.fire(Events.RANGE_CHANGED, rangeId);
        },
        false
      );

      canvasInstance.on(
        VolumeEvents.VOLUME_CHANGED,
        (volume: number) => {
          this._setCanvasInstanceVolumes(volume);
          this.fire(VolumeEvents.VOLUME_CHANGED, volume);
        },
        false
      );
    }

    public getCurrentRange(): Manifesto.Range | null {
      // @todo - change for time-slicing
      const rangeId = this._data!.helper!.getCurrentRange()!.id;
      return (
        this._getCurrentCanvas()!.ranges.find((range) => {
          return range.id === rangeId;
        }) || null
      );
    }

    private _prevRange(): void {
      // @todo - change for time-slicing
      if (!this._data || !this._data.helper) {
        return;
      }

      const currentRange: Manifesto.Range | null = this.getCurrentRange();
      if (currentRange) {
        const currentTime = this.getCurrentTime();
        const startTime = currentRange.getDuration()!.start || 0;
        // 5 = 5 seconds before going back to current range.
        if (currentTime - startTime > 5) {
          this.setCurrentTime(startTime);
          return;
        }
      }

      const prevRange: Manifesto.Range | null = this._data.helper.getPreviousRange();

      if (prevRange) {
        this.playRange(prevRange.id);
      } else {
        // no previous range. rewind.
        this._rewind();
      }
    }

    private _nextRange(): void {
      // @todo - change for time-slicing
      if (!this._data || !this._data.helper) {
        return;
      }

      const nextRange: Manifesto.Range | null = this._data.helper.getNextRange();

      if (nextRange) {
        this.playRange(nextRange.id);
      }
    }

    private _setCanvasInstanceVolumes(volume: number): void {
      this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
        canvasInstance.set({
          volume: volume,
        });
      });
    }

    private _getNormaliseCanvasId(canvasId: string): string {
      return canvasId.includes("://")
        ? Manifesto.Utils.normaliseUrl(canvasId)
        : canvasId;
    }

    private _getCanvasInstanceById(
      canvasId: string
    ): CanvasInstance | undefined {
      // @todo - figure out when this is used and if it needs time slicing considerations.

      canvasId = this._getNormaliseCanvasId(canvasId);

      // if virtual canvas is enabled, check for that first
      if (this._data.virtualCanvasEnabled) {
        for (let i = 0; i < this.canvasInstances.length; i++) {
          const canvasInstance: CanvasInstance = this
            .canvasInstances[i];

          let currentCanvasId:
            | string
            | undefined = canvasInstance.getCanvasId();

          if (currentCanvasId) {
            currentCanvasId = this._getNormaliseCanvasId(currentCanvasId);

            if (
              ((canvasInstance.isVirtual() ||
                this.canvasInstances.length === 1) &&
                currentCanvasId === canvasId) ||
              canvasInstance.includesVirtualSubCanvas(canvasId)
            ) {
              return canvasInstance;
            }
          }
        }
      } else {
        for (let i = 0; i < this.canvasInstances.length; i++) {
          const canvasInstance: CanvasInstance = this
            .canvasInstances[i];
          const id: string | undefined = canvasInstance.getCanvasId();

          if (id) {
            const canvasInstanceId: string = Manifesto.Utils.normaliseUrl(id);

            if (canvasInstanceId === canvasId) {
              return canvasInstance;
            }
          }
        }
      }

      return undefined;
    }

    private _getCurrentCanvas(): CanvasInstance | undefined {
      // @todo - use time slices to get current virtual canvas
      if (this._data.canvasId) {
        return this._getCanvasInstanceById(this._data.canvasId);
      }

      return undefined;
    }

    private _rewind(): void {
      if (this._data.limitToRange) {
        return;
      }

      const canvasInstance:
        | CanvasInstance
        | undefined = this._getCurrentCanvas();

      if (canvasInstance) {
        canvasInstance.set({
          range: undefined,
        });
      }
    }

    public play(): void {
      const currentCanvas:
        | CanvasInstance
        | undefined = this._getCurrentCanvas();

      if (currentCanvas) {
        currentCanvas.play();
      }
    }

    viewRange(rangeId: string) {
      const currentCanvas:
        | CanvasInstance
        | undefined = this._getCurrentCanvas();

      if (currentCanvas) {
        currentCanvas.viewRange(rangeId);
      }
    }

    public pause(): void {
      const currentCanvas:
        | CanvasInstance
        | undefined = this._getCurrentCanvas();

      if (currentCanvas) {
        currentCanvas.pause();
      }
    }

    public playRange(rangeId: string, autoChanged: boolean = false): void {
      if (!this._data.helper) {
        return;
      }

      const range: Manifesto.Range | null = this._data.helper.getRangeById(
        rangeId
      );

      if (range) {
        this.set({
          range: jQuery.extend(true, { autoChanged }, range),
        });
      }
    }

    public showCanvas(canvasId: string): void {
      // @todo - change for time-slicing, see where it's used and probably not used it.

      // if the passed canvas id is already the current canvas id, but the canvas isn't visible
      // (switching from virtual canvas)

      const currentCanvas:
        | CanvasInstance
        | undefined = this._getCurrentCanvas();

      if (
        this._data.virtualCanvasEnabled &&
        currentCanvas &&
        currentCanvas.getCanvasId() === canvasId &&
        !currentCanvas.isVisible()
      ) {
        currentCanvas.set({
          visible: true,
        });
      } else {
        this.set({
          canvasId: canvasId,
        });
      }
    }

    private _logMessage(message: string): void {
      this.fire(Events.LOG, message);
    }

    private _getPosterImageCss(expanded: boolean): any {
      const currentCanvas:
        | CanvasInstance
        | undefined = this._getCurrentCanvas();

      if (currentCanvas) {
        const $options: JQuery = currentCanvas.$playerElement.find(
          ".options-container"
        );
        const containerWidth: number = <number>(
          currentCanvas.$playerElement.parent().width()
        );
        const containerHeight: number =
          <number>currentCanvas.$playerElement.parent().height() -
          <number>$options.height();

        if (expanded) {
          return {
            top: 0,
            left: 0,
            width: containerWidth,
            height: containerHeight,
          };
        } else {
          // get the longer edge of the poster canvas and make that a ratio of the container height/width.
          // scale the shorter edge proportionally.
          let ratio: number;
          let width: number;
          let height: number;

          if (this._posterCanvasWidth > this._posterCanvasHeight) {
            ratio = this._posterCanvasHeight / this._posterCanvasWidth;
            width = containerWidth * <number>this._data.posterImageRatio;
            height = width * ratio;
          } else {
            // either height is greater, or width and height are equal
            ratio = this._posterCanvasWidth / this._posterCanvasHeight;
            height = containerHeight * <number>this._data.posterImageRatio;
            width = height * ratio;
          }

          return {
            top: 0,
            left: containerWidth - width,
            width: width,
            height: height,
          };
        }
      }

      return null;
    }

    public resize(): void {
      this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
        canvasInstance.resize();
      });

      // get the visible player and align the poster to it
      const currentCanvas:
        | CanvasInstance
        | undefined = this._getCurrentCanvas();

      if (currentCanvas) {
        if (this._$posterImage && this._$posterImage.is(":visible")) {
          if (this._posterImageExpanded) {
            this._$posterImage.css(this._getPosterImageCss(true));
          } else {
            this._$posterImage.css(this._getPosterImageCss(false));
          }

          // this._$posterExpandButton.css({
          //     top: <number>this._$posterImage.height() - <number>this._$posterExpandButton.outerHeight()
          // });
        }
      }
    }
  }

export class Events {
    static PLAY: string = "play";
    static PAUSE: string = "pause";
    static MEDIA_READY: string = "mediaready";
    static LOG: string = "log";
    static RANGE_CHANGED: string = "rangechanged";
    static WAVEFORM_READY: string = "waveformready";
    static WAVEFORMS_READY: string = "waveformsready";
  }

//
// (function (g: any) {
//   if (!g.IIIFComponents) {
//     g.IIIFComponents = IIIFComponents;
//   } else {
//     g.IIIFComponents.AVComponent = IIIFComponents.AVComponent;
//   }phpst
// })(window);
