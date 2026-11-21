export type RenderStatus = 'none' | 'pending' | 'done' | 'failed';

/** regionId -> materialId */
export type DesignAssignments = Record<string, string>;

export interface Design {
  id: string;
  projectId: string;
  name: string;
  assignments: DesignAssignments;
  /** Instant composite. */
  previewUrl: string | null;
  /** Photoreal AI render. */
  renderUrl: string | null;
  renderStatus: RenderStatus;
  renderError: string | null;
  updatedAt: string;
}

export interface CreateDesignParams {
  name: string;
  copyFromDesignId?: string;
}

export interface UpdateDesignParams {
  name?: string;
  assignments?: DesignAssignments;
}
