namespace IIIFComponents {
    
    export interface IAVComponentContent {
        play: string;
        pause: string;
        currentTime: string;
        duration: string;
    }
    
    export interface IAVComponentData {
        helper: Manifold.IHelper | null;
        autoPlay: boolean;
        defaultAspectRatio: number;
        content: IAVComponentContent;
    }
}