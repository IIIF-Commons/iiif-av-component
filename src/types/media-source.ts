import { MediaType } from '@iiif/vocabulary';

export interface MediaSource {
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
