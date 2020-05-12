import { Canvas, Range } from "manifesto.js";
import { MediaType } from "@iiif/vocabulary";
export declare class AVComponentUtils {
    private static _compare;
    static diff(a: any, b: any): string[];
    static getSpatialComponent(target: string): number[] | null;
    static getFirstTargetedCanvasId(range: Range): string | undefined;
    static getTimestamp(): string;
    static retargetTemporalComponent(canvases: Canvas[], target: string): string | undefined;
    static formatTime(aNumber: number): string;
    static isIE(): number | boolean;
    static isSafari(): boolean;
    static debounce(fn: any, debounceDuration: number): any;
    static hlsMimeTypes: string[];
    static normalise(num: number, min: number, max: number): number;
    static isHLSFormat(format: MediaType): boolean;
    static isMpegDashFormat(format: MediaType): boolean;
    static canPlayHls(): boolean;
}
