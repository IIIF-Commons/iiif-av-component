namespace IIIFComponents.AVComponentObjects {
    export class VirtualCanvas {
        
        private _canvases: Manifesto.ICanvas[] = [];
        public id: string;

        constructor() {
            
        }

        public addCanvas(canvas: Manifesto.ICanvas): void {
            this._canvases.push(canvas);
        }

        public getContent(): Manifesto.IAnnotation[] {

            const annotations: Manifesto.IAnnotation[] = [];

            this._canvases.forEach((canvas: Manifesto.ICanvas) => {
                annotations.concat(canvas.getContent());
            });

            return annotations;
        }

        getDuration(): number | null {

            let duration: number = 0;

            this._canvases.forEach((canvas: Manifesto.ICanvas) => {
                const d: number | null = canvas.getDuration();
                if (d) {
                    duration += d;
                }
            });
            
            return duration;
        }

        getWidth(): number {
            if (this._canvases.length) {
                return this._canvases[0].getWidth();
            }
            return 0;
        }

        getHeight(): number {
            if (this._canvases.length) {
                return this._canvases[0].getHeight();
            }
            return 0;
        }
    }
}