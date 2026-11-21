import { useCallback, useEffect, useState } from 'react';

/**
 * A browser-side preview of a file the user picked, so it can be shown before the
 * server has received it. The object URL is released whenever it is replaced or cleared.
 */
export function useLocalImagePreview() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) {
      return undefined;
    }
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const showFile = useCallback((file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const clear = useCallback(() => {
    setPreviewUrl(null);
  }, []);

  return { previewUrl, showFile, clear };
}
