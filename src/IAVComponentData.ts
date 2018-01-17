namespace IIIFComponents {
    
    export interface IAVComponentContent {
        play: string;
        pause: string;
        currentTime: string;
        duration: string;
    }
    
    export interface IAVComponentData {
        helper?: Manifold.IHelper;
        autoPlay?: boolean;
        defaultAspectRatio?: number;
        content?: IAVComponentContent;
        limitToRange?: boolean;
        [key: string]: any;
    }
}