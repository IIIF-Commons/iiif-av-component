import { Manifest, Range } from 'manifesto.js';
import { TimePlan } from '../types/time-plan';
import { MediaElement } from '../elements/media-element';
import { TimeStop } from '../types/time-stop';

export function createTimePlansFromManifest(manifest: Manifest, mediaElements: MediaElement[]) {
  const parseRange = (range: Range, rangeStack: string[] = [], startDuration = 0): TimePlan => {
    const timePlan: TimePlan = {
      type: 'time-plan',
      canvases: [],
      duration: 0,
      items: [],
      stops: [],
      rangeOrder: [range.id],
      end: 0,
      start: startDuration,
      rangeId: range.id,
      rangeStack,
    };

    let runningDuration = startDuration;

    const rangeRanges = [...range.items, ...range.getCanvasIds()];

    for (let canvasIndex = 0; canvasIndex < rangeRanges.length; canvasIndex++) {
      const ro = rangeRanges[canvasIndex];

      if (typeof ro === 'string') {
        const [, canvasId, start, end] = ro.match(/(.*)#t=([0-9.]+),?([0-9.]+)?/) || [undefined, ro, '0', '0'];

        // Skip invalid ranges.
        if (!canvasId || typeof start === 'undefined' || typeof end === 'undefined') continue;

        const canvas = manifest.getSequenceByIndex(0).getCanvasById(canvasId);

        if (canvas === null) {
          throw new Error('Canvas not found..');
        }

        timePlan.canvases.push(canvas.id);

        const rStart = parseFloat(start || '0');
        const rEnd = parseFloat(end || '0');
        const rDuration = rEnd - rStart;

        runningDuration += rDuration;

        const timeStop: TimeStop = {
          type: 'time-stop',
          canvasIndex,
          start: runningDuration - rDuration,
          end: runningDuration,
          duration: rDuration,
          rangeId: range.id,
          rawCanvasSelector: ro,
          canvasTime: {
            start: rStart,
            end: rEnd,
          },
          rangeStack,
        };

        timePlan.stops.push(timeStop);
        timePlan.items.push(timeStop);
      } else {
        const behavior = (ro as Range).getBehavior();
        if (!behavior || behavior !== 'no-nav') {
          const rangeTimePlan = parseRange(ro as any, [...rangeStack, ro.id], runningDuration);

          runningDuration += rangeTimePlan.duration;

          timePlan.stops.push(
            ...rangeTimePlan.stops.map((stop) => ({
              ...stop,
              canvasIndex: stop.canvasIndex + timePlan.canvases.length,
            }))
          );
          timePlan.canvases.push(...rangeTimePlan.canvases);
          timePlan.items.push(rangeTimePlan);
          timePlan.rangeOrder.push(...rangeTimePlan.rangeOrder);
        }
      }
    }

    timePlan.end = runningDuration;
    timePlan.duration = timePlan.end - timePlan.start;

    return timePlan;
  };

  let topLevels = manifest.getTopRanges();
  const plans: TimePlan[] = [];

  if (!topLevels) {
    topLevels = manifest.getAllRanges();
  }

  if (topLevels.length === 1 && !topLevels[0].id) {
    topLevels = topLevels[0].getRanges();
  }

  for (let range of topLevels) {
    const subRanges = range.getRanges();
    if (subRanges[0] && range.id === range.getRanges()[0].id) {
      range = range.getRanges()[0];
    }

    const rangeTimePlan = parseRange(range as Range, [range.id]);
    plans.push(rangeTimePlan);
  }

  return plans[0]; // @todo only one top level range.
}
