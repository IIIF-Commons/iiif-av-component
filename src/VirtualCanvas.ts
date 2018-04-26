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

                // shift the targets forward by the total previous canvas durations
                items.forEach((item: Manifesto.IAnnotation) => {
                    const target: string | null = item.getTarget();

                    if (target) {
                        let t: number[] | null = AVComponentUtils.Utils.getTemporalComponent(target);
                        
                        if (t) {
                            let offset: number = 0;
                            let targetWithoutTemporal: string = target.substr(0, target.indexOf('#'));

                            // loop through canvases adding up their durations until we reach the targeted canvas
                            for (let i = 0; i < this.canvases.length; i++) {
                                const canvas: Manifesto.ICanvas = this.canvases[i];
                                if (!canvas.id.includes(targetWithoutTemporal)) {
                                    const duration: number | null = canvas.getDuration();
                                    if (duration) {
                                        offset += duration;
                                    }
                                } else {
                                    // we've reached the canvas whose target we're adjusting
                                    break;
                                }
                            }

                            t[0] = Number(t[0]) + offset;
                            t[1] = Number(t[1]) + offset;

                            item.__jsonld.target = targetWithoutTemporal + '#t=' + t[0] + ',' + t[1];
                        }
                        
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