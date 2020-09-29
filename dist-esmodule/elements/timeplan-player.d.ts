import { TimePlan } from '../types/time-plan';
import { CompositeMediaElement } from './composite-media-element';
import { TimeStop } from '../types/time-stop';
export declare class TimePlanPlayer {
    plan: TimePlan;
    fullPlan: TimePlan;
    media: CompositeMediaElement;
    currentStop: TimeStop;
    currentRange: string;
    continuous: boolean;
    playing: boolean;
    _time: number;
    notifyRangeChange: (rangeId: string, stops: {
        from: TimeStop;
        to: TimeStop;
    }) => void;
    notifyTimeChange: (time: number) => void;
    notifyPlaying: (playing: boolean) => void;
    logging: boolean;
    constructor(media: CompositeMediaElement, plan: TimePlan, notifyRangeChange: (rangeId: string, stops: {
        from: TimeStop;
        to: TimeStop;
    }) => void, notifyTimeChange: (time: number) => void, notifyPlaying: (playing: boolean) => void);
    selectPlan({ reset, rangeId }?: {
        reset?: boolean;
        rangeId?: string;
    }): void;
    initialisePlan(plan: TimePlan): void;
    getCurrentRange(): {
        start: number;
        end: number;
        duration: number;
    };
    getTime(): number;
    setInternalTime(time: number): number;
    log(...content: any[]): void;
    setContinuousPlayback(continuous: boolean): void;
    setIsPlaying(playing: boolean): void;
    play(): number;
    currentMediaTime(): number;
    pause(): number;
    setVolume(volume: number): void;
    findStop(time: number): TimeStop | undefined;
    setTime(time: number, setRange?: boolean): Promise<void>;
    next(): number;
    previous(): number;
    setRange(id: string): number;
    isBuffering(): boolean;
    advanceToTime(time: number): {
        buffering: boolean;
        time: number;
        paused?: undefined;
    } | {
        paused: boolean;
        buffering: boolean;
        time: number;
    } | {
        time: number;
        buffering?: undefined;
        paused?: undefined;
    };
    hasEnded(): boolean;
    advanceToStop(from: TimeStop, to: TimeStop, rangeId?: string): Promise<void>;
    getStartTime(): number;
    getDuration(): number;
}
