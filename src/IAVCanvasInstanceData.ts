namespace IIIFComponents {
    
    export interface IAVCanvasInstanceData extends IAVComponentData {
        canvas?: Manifesto.ICanvas | AVComponentObjects.VirtualCanvas;
        range?: Manifesto.IRange;
        visible?: boolean;
        volume?: number;
    }
}