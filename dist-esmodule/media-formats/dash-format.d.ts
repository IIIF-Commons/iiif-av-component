import { MediaOptions } from '../types/media-options';
import { MediaFormat } from './abstract-media-format';
export declare class DashFormat extends MediaFormat {
    player: any;
    constructor(source: string, options?: MediaOptions);
    attachTo(element: HTMLMediaElement): void;
    debug(): void;
}
