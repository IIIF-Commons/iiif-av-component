namespace IIIFComponents.AVComponentObjects {
    export class CanvasRange {

        public rangeId: string | null = null;
        public duration: Duration | null = null;
        public nonav: boolean = false;

        constructor(range: Manifesto.IRange) {

            if (!range.canvases || !range.canvases.length) {
                return;
            }

            this.rangeId = range.id;
            const canvasId: string = range.canvases[0];

            // get the temporal part of the canvas id
            let temporal: number[] | null = AVComponentUtils.Utils.getTemporalComponent(canvasId);
            //const temporal: RegExpExecArray | null = /t=([^&]+)/g.exec(canvasId);

            if (temporal && temporal.length > 1) {
                //const rangeTiming: string[] = temporal[1].split(',');
                this.duration = new Duration(Number(temporal[0]), Number(temporal[1]));
            }

            this.nonav = range.getProperty('behavior') === 'no-nav';
        }

        public spans(time: number): boolean {

            if (this.duration) {
                if (time >= this.duration.start && time <= this.duration.end) {
                    return true;
                }
            }

            return false;            
        }

    }
}

