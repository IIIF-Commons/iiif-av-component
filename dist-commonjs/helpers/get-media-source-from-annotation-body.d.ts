import { Annotation, AnnotationBody } from 'manifesto.js';
import { MediaSource } from '../types/media-source';
export declare function getMediaSourceFromAnnotationBody(annotation: Annotation, body: AnnotationBody, canvasDimensions: {
    id: string;
    width: number;
    height: number;
    duration: number;
}): MediaSource;
