import { TimeStop } from './time-stop';
export declare type TimePlan = {
    type: 'time-plan';
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
