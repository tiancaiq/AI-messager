import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import {
  fitImageWithin,
  normalizeAndClampSelection,
  selectionWithinImageBoundsToPixelCrop,
  type PixelCrop,
  type Point,
  type Rectangle,
  type Size,
} from "./capture-geometry.js";
import type { CapturedImageResource } from "./capture-state.js";

interface CaptureSelectionProps {
  capture: CapturedImageResource;
  message: string | undefined;
  onCancel(): void;
  onFailure(message: string): void;
  onInvalid(message: string): void;
  onSelected(blob: Blob, size: Size): void;
}

interface ActiveDrag {
  pointerId: number;
  start: Point;
}

const invalidSelectionMessage = "Select a larger conversation region and try again.";
const cropFailureMessage = "That region could not be cropped. Please select it again.";

function pointInside(element: HTMLElement, event: ReactPointerEvent<HTMLElement>): Point {
  const bounds = element.getBoundingClientRect();
  return {
    x: event.clientX - bounds.left - element.clientLeft,
    y: event.clientY - bounds.top - element.clientTop,
  };
}

async function cropImage(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("Canvas is unavailable.");
  }

  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) {
        reject(new Error("Canvas did not produce an image."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

export function CaptureSelection({
  capture,
  message,
  onCancel,
  onFailure,
  onInvalid,
  onSelected,
}: CaptureSelectionProps) {
  const imageReference = useRef<HTMLImageElement>(null);
  const activeDragReference = useRef<ActiveDrag | null>(null);
  const mountedReference = useRef(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selection, setSelection] = useState<Rectangle | null>(null);
  const [cropping, setCropping] = useState(false);

  useEffect(() => {
    mountedReference.current = true;
    return () => {
      mountedReference.current = false;
    };
  }, []);

  const getImageSize = (): Size => {
    const image = imageReference.current;
    return {
      width: image?.naturalWidth ?? capture.width,
      height: image?.naturalHeight ?? capture.height,
    };
  };

  const getRenderedImageBounds = (stage: HTMLDivElement): Rectangle => {
    const stageBounds = stage.getBoundingClientRect();
    const imageBounds = imageReference.current?.getBoundingClientRect();

    if (imageBounds === undefined) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const fittedImage = fitImageWithin(
      { width: imageBounds.width, height: imageBounds.height },
      getImageSize(),
    );

    return {
      x: imageBounds.left - stageBounds.left - stage.clientLeft + fittedImage.x,
      y: imageBounds.top - stageBounds.top - stage.clientTop + fittedImage.y,
      width: fittedImage.width,
      height: fittedImage.height,
    };
  };

  const updateSelection = (stage: HTMLDivElement, start: Point, end: Point): Rectangle => {
    const imageBounds = getRenderedImageBounds(stage);
    const nextSelection = normalizeAndClampSelection(start, end, imageBounds);
    setSelection(nextSelection);
    return nextSelection;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!imageLoaded || cropping || !event.isPrimary || event.button !== 0) {
      return;
    }

    const start = pointInside(event.currentTarget, event);
    activeDragReference.current = { pointerId: event.pointerId, start };
    event.currentTarget.setPointerCapture(event.pointerId);
    updateSelection(event.currentTarget, start, start);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const activeDrag = activeDragReference.current;

    if (activeDrag === null || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    updateSelection(event.currentTarget, activeDrag.start, pointInside(event.currentTarget, event));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const activeDrag = activeDragReference.current;

    if (activeDrag === null || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    activeDragReference.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const end = pointInside(event.currentTarget, event);
    updateSelection(event.currentTarget, activeDrag.start, end);
    const imageSize = getImageSize();
    const crop = selectionWithinImageBoundsToPixelCrop({
      start: activeDrag.start,
      end,
      imageBounds: getRenderedImageBounds(event.currentTarget),
      image: imageSize,
    });

    if (crop === null) {
      onInvalid(invalidSelectionMessage);
      return;
    }

    const image = imageReference.current;

    if (image === null) {
      onInvalid(cropFailureMessage);
      return;
    }

    setCropping(true);
    void cropImage(image, crop)
      .then((blob) => {
        if (mountedReference.current) {
          onSelected(blob, { width: crop.width, height: crop.height });
        }
      })
      .catch(() => {
        if (mountedReference.current) {
          onInvalid(cropFailureMessage);
        }
      })
      .finally(() => {
        if (mountedReference.current) {
          setCropping(false);
        }
      });
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (activeDragReference.current?.pointerId !== event.pointerId) {
      return;
    }

    activeDragReference.current = null;
    setSelection(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <main className="capture-shell">
      <header className="capture-header">
        <div>
          <p className="eyebrow">Conversation capture</p>
          <h1>Select the conversation</h1>
          <p className="capture-instruction">Drag over the messages and compose box you need.</p>
        </div>
        <button className="button button-quiet" type="button" onClick={onCancel}>
          Cancel
        </button>
      </header>

      <div
        aria-label="Captured display. Drag to select the conversation region."
        className={`capture-stage${cropping ? " is-cropping" : ""}`}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="application"
      >
        <img
          ref={imageReference}
          alt="Captured display awaiting conversation selection"
          draggable={false}
          src={capture.imageUrl}
          onDragStart={(event) => event.preventDefault()}
          onError={() => onFailure("The captured display could not be shown. Please try again.")}
          onLoad={() => setImageLoaded(true)}
        />
        {selection === null ? null : (
          <div
            className="selection-rectangle"
            style={{
              left: selection.x,
              top: selection.y,
              width: selection.width,
              height: selection.height,
            }}
          />
        )}
        {!imageLoaded || cropping ? (
          <div className="capture-stage-status">
            {cropping ? "Preparing preview…" : "Preparing capture…"}
          </div>
        ) : null}
      </div>

      <footer className="capture-footer">
        <p aria-live="polite" className={message === undefined ? "" : "inline-error"}>
          {message ??
            `${capture.width} × ${capture.height} px · ${capture.display.scaleFactor}× display scale`}
        </p>
        <p>Press Esc to cancel</p>
      </footer>
    </main>
  );
}
