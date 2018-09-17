namespace IIIFComponents {
    
    export interface IAVComponentContent {
        currentTime: string;
        collapse: string;
        duration: string;
        expand: string;
        mute: string;
        next: string;
        pause: string;
        play: string;
        previous: string;
        unmute: string;
    }
    
    export interface IAVComponentData {
        [key: string]: any;
        adaptiveAuthEnabled?: boolean;
        autoPlay?: boolean;
        autoSelectRange?: boolean;
        canvasId?: string;
        constrainNavigationToRange?: boolean;
        content?: IAVComponentContent;
        defaultAspectRatio?: number;
        doubleClickMS?: number;
        helper?: Manifold.IHelper;
        halveAtWidth?: number;
        limitToRange?: boolean;
        posterImageRatio?: number;
        rangeId?: string;
        virtualCanvasEnabled?: boolean;
        waveformBarSpacing?: number; 
        waveformBarWidth?: number;
        waveformColor?: string;
    }
}