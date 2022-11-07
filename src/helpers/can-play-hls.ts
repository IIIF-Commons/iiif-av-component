import { hlsMimeTypes } from './hls-media-types';
import { getHls } from './get-hls';

export function canPlayHls() {
  const Hls = getHls();
  const doc = typeof document === 'object' && document;
  const videoElement = doc && doc.createElement('video');
  const isVideoSupported = Boolean(videoElement && videoElement.canPlayType);

  return (
    Hls &&
    isVideoSupported &&
    hlsMimeTypes.some((canItPlay: string) => {
      if (videoElement) {
        return /maybe|probably/i.test(videoElement.canPlayType(canItPlay));
      }
      return false;
    })
  );
}
