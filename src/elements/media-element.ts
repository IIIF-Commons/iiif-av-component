import { MediaFormat } from '../media-formats/abstract-media-format';
import { MediaOptions } from '../types/media-options';
import { DashFormat } from '../media-formats/dash-format';
import { HlsFormat } from '../media-formats/hls-format';
import { MpegFormat } from '../media-formats/mpeg-format';
import { DefaultFormat } from '../media-formats/default-format';
import { MediaSource } from '../types/media-source';
import { AnnotationTime } from '../helpers/relative-time';
import { Logger } from '../helpers/logger';

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
      case 'video':
        this.element = document.createElement('video');
        break;

      case 'sound':
      case 'audio':
        this.element = document.createElement('audio');
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
    this.element.classList.add('anno');
    this.element.crossOrigin = 'anonymous';
    this.element.preload = 'metadata';
    this.element.pause();

    this.instance.attachTo(this.element);
    this.element.currentTime = this.source.start;
  }

  syncClock(time: AnnotationTime) {
    if (time > this.element.duration) {
      Logger.error(`Clock synced out of bounds (max: ${this.element.duration}, got: ${time})`);
      return;
    }

    if (Math.abs(this.element.currentTime - time) > this.mediaSyncMarginSecs) {
      this.element.currentTime = time;
    }
  }

  getCanvasId() {
    return this.source.canvasId;
  }

  isWithinRange(time: number) {
    return this.source.start <= time && this.source.end >= time;
  }

  async load(withAudio = false): Promise<void> {
    if (withAudio) {
      this.element.load();
    }
    await new Promise<void>((resolve) => {
      this.element.addEventListener('loadedmetadata', () => {
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
    return this.format && this.format.toString() === 'application/dash+xml' && typeof dashjs !== 'undefined';
  }

  isHls() {
    return (
      this.format &&
      this.format.toString() === 'application/vnd.apple.mpegurl' &&
      typeof Hls !== 'undefined' &&
      Hls.isSupported()
    );
  }

  isMpeg(): boolean {
    return this.element.canPlayType('application/vnd.apple.mpegurl') !== '';
  }

  stop() {
    this.element.pause();
    this.element.currentTime = this.source.start;
  }

  play(time?: AnnotationTime): Promise<void> {
    Logger.log(`MediaElement.play(${time})`);

    if (typeof time !== 'undefined') {
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
