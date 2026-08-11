export interface DisplayCaptureSource {
  display_id: string;
}

export function selectCaptureSource<T extends DisplayCaptureSource>(
  sources: T[],
  displayId: string,
): T | undefined {
  return (
    sources.find((candidate) => candidate.display_id === displayId) ??
    (sources.length === 1 ? sources[0] : undefined)
  );
}
