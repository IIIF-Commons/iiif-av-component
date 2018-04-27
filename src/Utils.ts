namespace IIIFComponents.AVComponentUtils {
    export class Utils {

        private static _compare(a: any, b: any): string[] {
            const changed: string[] = [];
            Object.keys(a).forEach((p) => {
                if (!Object.is(b[p], a[p])) {
                    changed.push(p);
                }
            });
            return changed;
        }
        
        public static diff(a: any, b: any) {
            return Array.from(new Set(Utils._compare(a, b).concat(Utils._compare(b, a))));
        }

        public static getSpatialComponent(target: string): number[] | null {
            const spatial: RegExpExecArray | null = /xywh=([^&]+)/g.exec(target);
            let xywh: number[] | null = null;

            if (spatial && spatial[1]) {
                xywh = <any>spatial[1].split(',');
            }

            return xywh;
        }

        public static getTemporalComponent(target: string): number[] | null {
            const temporal: RegExpExecArray | null = /t=([^&]+)/g.exec(target);
            let t: number[] | null = null;

            if (temporal && temporal[1]) {
                t = <any>temporal[1].split(',');
            }

            return t;
        }

        public static retargetTemporalComponent(canvases: Manifesto.ICanvas[], target: string): string | undefined {
            
            let t: number[] | null = AVComponentUtils.Utils.getTemporalComponent(target);

            if (t) {

                let offset: number = 0;
                let targetWithoutTemporal: string = target.substr(0, target.indexOf('#'));

                // loop through canvases adding up their durations until we reach the targeted canvas
                for (let i = 0; i < canvases.length; i++) {
                    const canvas: Manifesto.ICanvas = canvases[i];
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

                return targetWithoutTemporal + '#t=' + t[0] + ',' + t[1];
            }

            return undefined;
        }

        public static formatTime(aNumber: number): string {

            let hours: number | string, minutes: number | string, seconds: number | string, hourValue: string;

            seconds 	= Math.ceil(aNumber);
            hours 		= Math.floor(seconds / (60 * 60));
            hours 		= (hours >= 10) ? hours : '0' + hours;
            minutes 	= Math.floor(seconds % (60*60) / 60);
            minutes 	= (minutes >= 10) ? minutes : '0' + minutes;
            seconds 	= Math.floor(seconds % (60*60) % 60);
            seconds 	= (seconds >= 10) ? seconds : '0' + seconds;

            if (hours >= 1) {
                hourValue = hours + ':';
            } else {
                hourValue = '';
            }

            return hourValue + minutes + ':' + seconds;
        }

    }
}