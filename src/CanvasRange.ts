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

            // if there are multiple canvases, get the start of the first canvas,
            // and the end of the last canvas.

            let start: number | undefined;
            let end: number | undefined;

            for (let i = 0; i < range.canvases.length; i++) {
                const canvas: string = range.canvases[i];
                let temporal: number[] | null = AVComponentUtils.Utils.getTemporalComponent(canvas);
                if (temporal && temporal.length > 1) {
                    if (i === 0) {
                        start = Number(temporal[0]);
                    }

                    if (i === range.canvases.length - 1) {
                        end = Number(temporal[1]);
                    }
                }
            }

            if (start !== undefined && end !== undefined) {
                this.duration = new Duration(start, end);
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

