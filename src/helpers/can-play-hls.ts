import { hlsMimeTypes } from './hls-media-types';

export function canPlayHls() {
  const doc = typeof document === 'object' && document;
  const videoElement = doc && doc.createElement('video');
  const isVideoSupported = Boolean(videoElement && videoElement.canPlayType);

  return (
    isVideoSupported &&
    hlsMimeTypes.some((canItPlay: string) => {
      if (videoElement) {
        return /maybe|probably/i.test(videoElement.canPlayType(canItPlay));
      }
      return false;
    })
  );
}
