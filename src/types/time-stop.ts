import { CanvasTime, TimelineTime } from '../helpers/relative-time';

export type TimeStop = {
  type: 'time-stop';
  canvasIndex: number;
  start: TimelineTime;
  end: TimelineTime;
  duration: TimelineTime;
  rangeId: string;
  rawCanvasSelector: string;
  rangeStack: string[];
  canvasTime: {
    start: CanvasTime;
    end: CanvasTime;
  };
};
