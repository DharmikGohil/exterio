import { useCallback, useRef, type ChangeEvent } from 'react';

/** A hidden `<input type="file">` that can be opened from any button. */
export function useFilePicker(onFileSelected: (file: File) => void) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Clear the value so choosing the same file again still fires a change event.
      event.target.value = '';
      if (file) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  return { inputRef, openPicker, handleChange };
}
