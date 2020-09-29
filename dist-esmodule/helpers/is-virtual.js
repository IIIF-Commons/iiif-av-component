import { VirtualCanvas } from '../elements/virtual-canvas';
export function isVirtual(canvas) {
    if (!canvas) {
        return false;
    }
    return canvas instanceof VirtualCanvas;
}
//# sourceMappingURL=is-virtual.js.map