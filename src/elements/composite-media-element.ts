import { MediaElement } from './media-element';
import { AnnotationTime, minusTime } from '../helpers/relative-time';
import { Logger } from '../helpers/logger';
// @ts-ignore
import { JQueryStatic } from 'jquery';

export class CompositeMediaElement {
  elements: MediaElement[] = [];

  activeElement?: MediaElement;
  playing = false;

  canvasMap: {
    [id: string]: MediaElement[];
  } = {};

  private _onPlay: ((canvasId: string, time: number, el: MediaElement) => void)[] = [];
  private _onPause: ((canvasId: string, time: number, el: MediaElement) => void)[] = [];
  private _onBuffering: ((canvasId: string, time: number, el: MediaElement) => void)[] = [];

  constructor(mediaElements: MediaElement[]) {
    Logger.log('Composite media element', mediaElements);
    // Add all elements.
    this.elements = mediaElements;
    for (const el of mediaElements) {
      const canvasId = el.getCanvasId();
      this.canvasMap[canvasId] = this.canvasMap[canvasId] ? this.canvasMap[canvasId] : [];
      this.canvasMap[canvasId].push(el);
      // Attach events.
      el.element.addEventListener('play', () => {
        if (el === this.activeElement) {
          this._onPlay.forEach((fn) => fn(canvasId, el.element.currentTime, el));
        }
      });
      el.element.addEventListener('pause', () => {
        if (el === this.activeElement) {
          this._onPause.forEach((fn) => fn(canvasId, el.element.currentTime, el));
        }
      });
      el.element.addEventListener('waiting', () => {
        if (el === this.activeElement) {
          this._onBuffering.forEach((fn) => fn(canvasId, el.element.currentTime, el));
        }
      });
    }
    this.activeElement = mediaElements[0];
  }

  syncClock(time: AnnotationTime) {
    Logger.group('CompositeMediaElement.syncClock');
    Logger.log(`syncClock: ${time}`);
    Logger.log({
      fromTime: time,
      toTime: time,
      instance: this,
    });

    if (this.activeElement) {
      this.updateActiveElement(this.activeElement.getCanvasId(), time);
      const realTime = minusTime(time, this.activeElement.source.start);
      this.activeElement.syncClock(realTime);
    }
    Logger.groupEnd();
  }

  updateActiveElement(canvasId: string, time: AnnotationTime) {
    const newElement = this.findElementInRange(canvasId, time);

    Logger.log(`CompositeMediaElement.seekTo(canvasId: ${canvasId}, time: ${time})`, {
      canvasId: newElement ? newElement.source.canvasId : null,
      newElement,
    });

    if (this.activeElement && newElement && newElement !== this.activeElement) {
      // Moving track.
      // Stop the current track.
      this.activeElement.stop();

      // Set new current track.
      this.activeElement = newElement;
    }
  }

  onPlay(func: (canvasId: string, time: number, el: MediaElement) => void) {
    this._onPlay.push(func);
  }

  onPause(func: (canvasId: string, time: number, el: MediaElement) => void) {
    this._onPause.push(func);
  }

  onBuffering(func: (canvasId: string, time: number, el: MediaElement) => void) {
    this._onBuffering.push(func);
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

  appendTo($element: JQueryStatic) {
    Logger.log(
      'Appending...',
      this.elements.map((media) => media.element)
    );
    $element.append(this.elements.map((media) => media.element));
  }

  async load(): Promise<void> {
    await Promise.all(this.elements.map((element) => element.load()));
  }

  async seekToMediaTime(annotationTime: AnnotationTime) {
    const prevActiveElement = this.activeElement;

    if (this.activeElement) {
      this.updateActiveElement(this.activeElement.getCanvasId(), annotationTime);

      const realTime = minusTime(annotationTime, this.activeElement.source.start);


      let defer;
      const promise = new Promise((resolve) => (defer = resolve));

      if (this.playing) {
        Logger.log(`CompositeMediaElement.seekToMediaItem(${annotationTime})`);

        await this.activeElement.play(realTime).catch((e) => {
          console.log('ERROR', e);
          this.playing = false;
        });

        if (prevActiveElement !== this.activeElement) {
          if (this.activeElement.isBuffering() || this.activeElement.element.paused) {
            const cb = () => {
              if (!this.isBuffering()) {
                defer();
              }
            };
            const interval = setInterval(cb, 200);
            await promise;
            clearInterval(interval);
            await this.activeElement.element.play();
          }
        }
      } else {
        this.activeElement.syncClock(realTime);
      }
    }
  }

  async seekTo(canvasId: string, time: AnnotationTime) {
    this.updateActiveElement(canvasId, time);

    return this.seekToMediaTime(time);
  }

  async play(canvasId?: string, time?: AnnotationTime) {
    this.playing = true;
    if (canvasId && typeof time !== 'undefined') {
      await this.seekTo(canvasId, time);
    }
    if (this.activeElement) {
      Logger.log(`CompositeMediaElement.play(${canvasId}, ${time})`);
      return this.activeElement.play(time).catch(() => {
        this.playing = false;
      });
    }
  }

  pause() {
    Logger.log('Composite.pause()');
    this.playing = false;
    if (this.activeElement && !this.activeElement.element.paused) {
      this.activeElement.pause();
    }
  }

  setVolume(volume: number) {
    for (const el of this.elements) {
      el.element.volume = volume;
    }
  }

  isBuffering() {
    return this.activeElement ? this.activeElement.isBuffering() : false;
  }
}
