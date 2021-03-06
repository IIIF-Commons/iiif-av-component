export function getSpatialComponent(target: string): number[] | null {
  const spatial: RegExpExecArray | null = /xywh=([^&]+)/g.exec(target);
  let xywh: number[] | null = null;

  if (spatial && spatial[1]) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    xywh = <any>spatial[1].split(',');
  }

  return xywh;
}
