namespace IIIFComponents {
    
    export interface IAVCanvasInstanceData extends IAVComponentData {
        canvas?: Manifesto.ICanvas;
        range?: AVComponentObjects.CanvasRange;
        visible?: boolean;
    }
}