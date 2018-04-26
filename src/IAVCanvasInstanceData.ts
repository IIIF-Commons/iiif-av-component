namespace IIIFComponents {
    
    export interface IAVCanvasInstanceData extends IAVComponentData {
        canvas?: Manifesto.ICanvas | AVComponentObjects.VirtualCanvas;
        range?: AVComponentObjects.CanvasRange;
        visible?: boolean;
        volume?: number;
    }
}