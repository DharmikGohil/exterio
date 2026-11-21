import { useCallback, useState } from 'react';

export type DesignViewMode = 'design' | 'compare';
export type DesignImageSource = 'preview' | 'render';

/** What the Design canvas shows: which region is picked, edit vs compare, preview vs render. */
export function useDesignView() {
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<DesignViewMode>('design');
  const [imageSource, setImageSource] = useState<DesignImageSource>('preview');

  const selectRegion = useCallback((regionId: string | null) => {
    setSelectedRegionId(regionId);
    // Picking a region means the user wants to edit, not compare.
    if (regionId !== null) {
      setViewMode('design');
    }
  }, []);

  return {
    selectedRegionId,
    selectRegion,
    hoveredRegionId,
    setHoveredRegionId,
    viewMode,
    setViewMode,
    imageSource,
    setImageSource,
  };
}
