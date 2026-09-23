import { sep } from "node:path";

export function resolveAsarUnpackedPath(stagedPath: string, separator = sep): string {
  const archiveSegment = `${separator}app.asar${separator}`;
  return stagedPath.includes(archiveSegment)
    ? stagedPath.replace(archiveSegment, `${separator}app.asar.unpacked${separator}`)
    : stagedPath;
}
