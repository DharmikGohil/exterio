/** Saves a Blob to the user's device under the given file name. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before releasing the URL.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

/** A file-system friendly version of a user-typed name. */
export function toFileSlug(value: string, fallback = 'report'): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}
