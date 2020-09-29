export declare type TimeStop = {
    type: 'time-stop';
    canvasIndex: number;
    start: number;
    end: number;
    duration: number;
    rangeId: string;
    rawCanvasSelector: string;
    rangeStack: string[];
    canvasTime: {
        start: number;
        end: number;
    };
};
