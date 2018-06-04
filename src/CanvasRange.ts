namespace IIIFComponents.AVComponentObjects {
    export class CanvasRange {

        public rangeId: string | undefined;
        public duration: Duration | undefined;
        public nonav: boolean = false;
        public parentRange: CanvasRange | undefined;

        constructor(range: Manifesto.IRange) {

            // if (!range.canvases || !range.canvases.length) {
            //     return;
            // }

            this.rangeId = range.id;

            if (range.parentRange) {
                this.parentRange = new CanvasRange(range.parentRange);
            }

            this.duration = AVComponentUtils.Utils.getRangeDuration(range);

            const behavior: any = range.getProperty('behavior');

            if (behavior) {
                this.nonav = behavior[0] === 'no-nav';
            }
            
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

