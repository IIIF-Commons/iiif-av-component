import { beforeAll, describe, expect, vitest } from 'vitest';
import { Manifest } from 'manifesto.js';
import beethoven from './fixtures/beethoven.json';
import { compositeMediaFromCanvases } from '../src/helpers/composite-media-from-canvases';
import { createTimePlansFromManifest } from '../src/helpers/create-time-plans-from-manifest';
import { TimePlanPlayer } from '../src/elements/timeplan-player';

beforeAll(() => {
  window.HTMLMediaElement.prototype.load = vitest.fn();
  window.HTMLMediaElement.prototype.play = vitest.fn(() => {
    return Promise.resolve();
  });
  window.HTMLMediaElement.prototype.pause = vitest.fn();
  window.HTMLMediaElement.prototype.addTextTrack = vitest.fn();
});

describe('Composite media', () => {
  test('creating composite media from canvases', () => {
    const manifest = new Manifest(beethoven);

    const [composite, waveforms] = compositeMediaFromCanvases(manifest.getSequenceByIndex(0).getCanvases());
    const timeplan = createTimePlansFromManifest(manifest);

    const player = new TimePlanPlayer(composite, timeplan, (rangeId, stops) => {
      //
    });

    expect(player.currentStop.rangeId).toEqual('https://api.bl.uk/metadata/iiif/ark:/81055/tvdc_100005114784.0x000005');
    expect(player.media.activeElement).toEqual(composite.elements[0]);
    expect(player.media.activeElement?.source.start).toEqual(0);
    expect(player.media.activeElement?.source.end).toEqual(211.04);

    player.play();

    expect(player._time).toEqual(0);
    expect(player.media.activeElement).toEqual(composite.elements[0]);

    player.advanceToTime(300);

    expect(player._time).toEqual(300);
    expect(player.media.activeElement).toEqual(composite.elements[1]);

    // // Advance time.
    // player.advanceToTime(300);
    //
    // expect(player.currentStop.rangeId).toEqual('https://api.bl.uk/metadata/iiif/ark:/81055/tvdc_100005114784.0x000005');
    // expect(player.media.activeElement).toEqual(composite.elements[1]);
    //
    // expect(composite).toBeDefined();

    //
  });
});
