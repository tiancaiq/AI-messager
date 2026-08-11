export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle extends Point, Size {}

export type PixelCrop = Rectangle;

export const MIN_SELECTION_CSS_PIXELS = 8;

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

const hasUsableSize = ({ width, height }: Size): boolean =>
  Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;

export function fitImageWithin(container: Size, image: Size): Rectangle {
  if (!hasUsableSize(container) || !hasUsableSize(image)) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const scale = Math.min(container.width / image.width, container.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;

  return {
    x: (container.width - width) / 2,
    y: (container.height - height) / 2,
    width,
    height,
  };
}

export function normalizeAndClampSelection(start: Point, end: Point, bounds: Rectangle): Rectangle {
  if (!hasUsableSize(bounds)) {
    return { x: bounds.x, y: bounds.y, width: 0, height: 0 };
  }

  const left = clamp(Math.min(start.x, end.x), bounds.x, bounds.x + bounds.width);
  const right = clamp(Math.max(start.x, end.x), bounds.x, bounds.x + bounds.width);
  const top = clamp(Math.min(start.y, end.y), bounds.y, bounds.y + bounds.height);
  const bottom = clamp(Math.max(start.y, end.y), bounds.y, bounds.y + bounds.height);

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

export function selectionToPixelCrop({
  start,
  end,
  container,
  image,
  minimumCssPixels = MIN_SELECTION_CSS_PIXELS,
}: {
  start: Point;
  end: Point;
  container: Size;
  image: Size;
  minimumCssPixels?: number;
}): PixelCrop | null {
  const imageBounds = fitImageWithin(container, image);
  return selectionWithinImageBoundsToPixelCrop({
    start,
    end,
    imageBounds,
    image,
    minimumCssPixels,
  });
}

export function selectionWithinImageBoundsToPixelCrop({
  start,
  end,
  imageBounds,
  image,
  minimumCssPixels = MIN_SELECTION_CSS_PIXELS,
}: {
  start: Point;
  end: Point;
  imageBounds: Rectangle;
  image: Size;
  minimumCssPixels?: number;
}): PixelCrop | null {
  const selection = normalizeAndClampSelection(start, end, imageBounds);

  if (
    !hasUsableSize(imageBounds) ||
    selection.width < minimumCssPixels ||
    selection.height < minimumCssPixels
  ) {
    return null;
  }

  const scaleX = image.width / imageBounds.width;
  const scaleY = image.height / imageBounds.height;
  const left = clamp(Math.floor((selection.x - imageBounds.x) * scaleX), 0, image.width);
  const right = clamp(
    Math.ceil((selection.x + selection.width - imageBounds.x) * scaleX),
    0,
    image.width,
  );
  const top = clamp(Math.floor((selection.y - imageBounds.y) * scaleY), 0, image.height);
  const bottom = clamp(
    Math.ceil((selection.y + selection.height - imageBounds.y) * scaleY),
    0,
    image.height,
  );

  if (right <= left || bottom <= top) {
    return null;
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}
