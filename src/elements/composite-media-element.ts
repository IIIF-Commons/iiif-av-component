import { MediaElement } from './media-element';

export class CompositeMediaElement {
  elements: MediaElement[] = [];

  activeElement: MediaElement;
  playing = false;

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
      this.canvasMap[canvasId] = this.canvasMap[canvasId] ? this.canvasMap[canvasId] : [];
      this.canvasMap[canvasId].push(el);
      // Attach events.
      el.element.addEventListener('play', () => {
        this._onPlay.forEach((fn) => fn(canvasId, el.element.currentTime, el));
      });
      el.element.addEventListener('pause', () => {
        this._onPause.forEach((fn) => fn(canvasId, el.element.currentTime, el));
      });
    }
    this.activeElement = mediaElements[0];
  }

  syncClock(time: number) {
    this.activeElement.syncClock(time);
  }

  onPlay(func: (canvasId: string, time: number, el: HTMLMediaElement) => void) {
    this._onPlay.push(func);
  }

  onPause(func: (canvasId: string, time: number, el: HTMLMediaElement) => void) {
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
      'Appending...',
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
    if (canvasId && typeof time !== 'undefined') {
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
