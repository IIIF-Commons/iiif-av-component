import { Canvas, Annotation } from 'manifesto.js';
export declare class VirtualCanvas {
    canvases: Canvas[];
    id: string;
    durationMap: {
        [id: string]: {
            duration: number;
            runningDuration: number;
        };
    };
    totalDuration: number;
    constructor();
    addCanvas(canvas: Canvas): void;
    getContent(): Annotation[];
    getDuration(): number | null;
    getWidth(): number;
    getHeight(): number;
}
