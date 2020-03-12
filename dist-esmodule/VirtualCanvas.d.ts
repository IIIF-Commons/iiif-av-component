import { Annotation, Canvas } from "manifesto.js";
export declare class VirtualCanvas {
    canvases: Canvas[];
    id: string;
    constructor();
    addCanvas(canvas: Canvas): void;
    getContent(): Annotation[];
    getDuration(): number | null;
    getWidth(): number;
    getHeight(): number;
}
