import type { CreateDesignParams, Design, UpdateDesignParams } from '@/domain/models/design';

export interface IDesignService {
  createDesign(projectId: string, params: CreateDesignParams): Promise<Design>;
  getDesign(designId: string): Promise<Design>;
  /** The instant preview is re-rendered before the design is returned. */
  updateDesign(designId: string, params: UpdateDesignParams): Promise<Design>;
  deleteDesign(designId: string): Promise<void>;
  /** Starts a photoreal render; poll `getDesign` while `renderStatus` is `pending`. */
  requestRender(designId: string): Promise<Design>;
}
