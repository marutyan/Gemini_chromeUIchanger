namespace Gcuic {
  export interface LayoutMetrics {
    mainWidthPx: number;
    gutterPx: number;
    textWidthPx: number;
    canvasWidthPx: number;
    compact: boolean;
  }

  export const MIN_ACTIVE_WIDTH_PX = 960;
  const MIN_GUTTER_PX = 16;
  const MAX_GUTTER_PX = 48;
  const MIN_TEXT_CAP_PX = 1200;
  const MAX_TEXT_CAP_PX = 1400;
  const MAX_CANVAS_WIDTH_PX = 1680;

  export function calculateLayoutMetrics(mainWidthPx: number): LayoutMetrics {
    const safeWidth = Number.isFinite(mainWidthPx) && mainWidthPx > 0
      ? mainWidthPx
      : 0;
    const gutterPx = roundPixel(
      clamp(safeWidth * 0.025, MIN_GUTTER_PX, MAX_GUTTER_PX),
    );
    const canvasWidthPx = roundPixel(
      Math.max(0, Math.min(safeWidth - 2 * gutterPx, MAX_CANVAS_WIDTH_PX)),
    );
    const textCapPx = clamp(
      safeWidth * 0.8,
      MIN_TEXT_CAP_PX,
      MAX_TEXT_CAP_PX,
    );
    const textWidthPx = roundPixel(Math.min(canvasWidthPx, textCapPx));

    return {
      mainWidthPx: roundPixel(safeWidth),
      gutterPx,
      textWidthPx,
      canvasWidthPx,
      compact: safeWidth < MIN_ACTIVE_WIDTH_PX,
    };
  }

  function clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), maximum);
  }

  function roundPixel(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
