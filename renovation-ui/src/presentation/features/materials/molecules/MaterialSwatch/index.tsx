import { useState } from 'react';

import { cn } from '@/presentation/shared/utils/cn';
import { resolveFileUrl } from '@/presentation/shared/utils/fileUrl';

export interface MaterialSwatchProps {
  swatchUrl: string;
  /** Shown behind the image and when the image cannot be loaded. */
  colorHex: string;
  className?: string;
}

/** A material's texture image over its base colour. */
export function MaterialSwatch({ swatchUrl, colorHex, className }: MaterialSwatchProps) {
  const [hasFailed, setHasFailed] = useState(false);
  const src = resolveFileUrl(swatchUrl);

  return (
    <span className={cn('relative block overflow-hidden bg-stone-200', className)}>
      <svg aria-hidden className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <rect width="100%" height="100%" fill={colorHex} />
      </svg>
      {src && !hasFailed && (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setHasFailed(true)}
        />
      )}
    </span>
  );
}
