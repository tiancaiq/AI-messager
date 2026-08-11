import { describe, expect, it } from "vitest";

import {
  fitImageWithin,
  normalizeAndClampSelection,
  selectionWithinImageBoundsToPixelCrop,
  selectionToPixelCrop,
} from "./capture-geometry.js";

const container = { width: 1000, height: 500 };
const retinaImage = { width: 2000, height: 1000 };
const expectedCrop = { x: 200, y: 100, width: 1000, height: 500 };

describe("capture geometry", () => {
  it.each([
    ["top-left to bottom-right", { x: 100, y: 50 }, { x: 600, y: 300 }],
    ["bottom-right to top-left", { x: 600, y: 300 }, { x: 100, y: 50 }],
    ["bottom-left to top-right", { x: 100, y: 300 }, { x: 600, y: 50 }],
    ["top-right to bottom-left", { x: 600, y: 50 }, { x: 100, y: 300 }],
  ])("converts a %s drag", (_label, start, end) => {
    expect(selectionToPixelCrop({ start, end, container, image: retinaImage })).toEqual(
      expectedCrop,
    );
  });

  it("normalizes and clamps a selection to image bounds", () => {
    expect(
      normalizeAndClampSelection(
        { x: 1100, y: 700 },
        { x: -50, y: -20 },
        { x: 0, y: 0, width: 1000, height: 500 },
      ),
    ).toEqual({ x: 0, y: 0, width: 1000, height: 500 });
  });

  it("accounts for letterboxing before clamping to the full source image", () => {
    expect(fitImageWithin({ width: 1000, height: 800 }, { width: 1600, height: 900 })).toEqual({
      x: 0,
      y: 118.75,
      width: 1000,
      height: 562.5,
    });

    expect(
      selectionToPixelCrop({
        start: { x: -20, y: 0 },
        end: { x: 1200, y: 900 },
        container: { width: 1000, height: 800 },
        image: { width: 1600, height: 900 },
      }),
    ).toEqual({ x: 0, y: 0, width: 1600, height: 900 });
  });

  it("uses actual image-to-CSS scaling without double-applying device pixel ratio", () => {
    expect(
      selectionToPixelCrop({
        start: { x: 125, y: 100 },
        end: { x: 625, y: 500 },
        container: { width: 1500, height: 1000 },
        image: { width: 3000, height: 2000 },
      }),
    ).toEqual({ x: 250, y: 200, width: 1000, height: 800 });
  });

  it("rounds near edges down and far edges up to include selected pixels", () => {
    expect(
      selectionToPixelCrop({
        start: { x: 10.2, y: 5.2 },
        end: { x: 20.2, y: 15.2 },
        container,
        image: retinaImage,
      }),
    ).toEqual({ x: 20, y: 10, width: 21, height: 21 });
  });

  it("maps from an explicitly offset rendered image content box", () => {
    expect(
      selectionWithinImageBoundsToPixelCrop({
        start: { x: 10.5, y: 20.25 },
        end: { x: 810.5, y: 420.25 },
        imageBounds: { x: 10.5, y: 20.25, width: 800, height: 400 },
        image: { width: 1600, height: 800 },
      }),
    ).toEqual({ x: 0, y: 0, width: 1600, height: 800 });
  });

  it("rejects too-small, zero-area, and unusable selections", () => {
    expect(
      selectionToPixelCrop({
        start: { x: 10, y: 10 },
        end: { x: 17.9, y: 30 },
        container,
        image: retinaImage,
      }),
    ).toBeNull();
    expect(
      selectionToPixelCrop({
        start: { x: 10, y: 10 },
        end: { x: 10, y: 10 },
        container,
        image: retinaImage,
      }),
    ).toBeNull();
    expect(
      selectionToPixelCrop({
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        container: { width: 0, height: 0 },
        image: retinaImage,
      }),
    ).toBeNull();
  });
});
