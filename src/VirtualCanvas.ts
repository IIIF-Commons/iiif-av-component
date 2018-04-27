namespace IIIFComponents.AVComponentObjects {
    export class VirtualCanvas {
        
        public canvases: Manifesto.ICanvas[] = [];
        public id: string;

        constructor() {
            
        }

        public addCanvas(canvas: Manifesto.ICanvas): void {
            this.canvases.push(canvas);
        }

        public getContent(): Manifesto.IAnnotation[] {

            const annotations: Manifesto.IAnnotation[] = [];

            this.canvases.forEach((canvas: Manifesto.ICanvas) => {
                const items: Manifesto.IAnnotation[] = canvas.getContent();

                // if the annotations have no temporal target, add one so that
                // they specifically target the duration of their canvas
                items.forEach((item: Manifesto.IAnnotation) => {
                    const target: string | null = item.getTarget();

                    if (target) {
                        let t: number[] | null = AVComponentUtils.Utils.getTemporalComponent(target);
                        if (!t) {
                            item.__jsonld.target += '#t=0,' + canvas.getDuration();
                        }
                    }
                    
                });

                items.forEach((item: Manifesto.IAnnotation) => {
                    const target: string | null = item.getTarget();

                    if (target) {
                        item.__jsonld.target = AVComponentUtils.Utils.retargetTemporalComponent(this.canvases, target);                        
                    }
                });

                annotations.push(...items);
            });

            return annotations;
        }

        getDuration(): number | null {

            let duration: number = 0;

            this.canvases.forEach((canvas: Manifesto.ICanvas) => {
                const d: number | null = canvas.getDuration();
                if (d) {
                    duration += d;
                }
            });
            
            return duration;
        }

        getWidth(): number {
            if (this.canvases.length) {
                return this.canvases[0].getWidth();
            }
            return 0;
        }

        getHeight(): number {
            if (this.canvases.length) {
                return this.canvases[0].getHeight();
            }
            return 0;
        }
    }
}