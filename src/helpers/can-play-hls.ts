import { getHls } from './get-hls';

export function canPlayHls() {
  const Hls = getHls();
  return Hls && Hls.isSupported();
}
