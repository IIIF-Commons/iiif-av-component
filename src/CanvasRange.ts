namespace IIIFComponents.AVComponentObjects {
    export class CanvasRange {

        public duration: Duration | null = null;

        constructor(canvasId: string) {
            // get the temporal part of the canvas id
            const temporal: RegExpExecArray | null = /t=([^&]+)/g.exec(canvasId);
                        
            if (temporal && temporal.length > 1) {
                const rangeTiming: string[] = temporal[1].split(',');
                this.duration = new Duration(Number(rangeTiming[0]), Number(rangeTiming[1]));
            }

        }

    }
}

