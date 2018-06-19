namespace IIIFComponents {
    
    export interface IAVComponentContent {
        currentTime: string;
        duration: string;
        mute: string;
        next: string;
        pause: string;
        play: string;
        previous: string;
    }
    
    export interface IAVComponentData {
        [key: string]: any;
        autoPlay?: boolean;
        autoSelectRange?: boolean;
        canvasId?: string;
        constrainNavigationToRange?: boolean;
        content?: IAVComponentContent;
        defaultAspectRatio?: number;
        doubleClickMS?: number;
        helper?: Manifold.IHelper;
        limitToRange?: boolean;
        rangeId?: string;
        virtualCanvasEnabled?: boolean;
    }
}