import { MediaOptions } from '../types/media-options';
import { MediaFormat } from './abstract-media-format';

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
