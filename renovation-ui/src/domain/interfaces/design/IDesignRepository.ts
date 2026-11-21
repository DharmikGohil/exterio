import type { CreateDesignParams, Design, UpdateDesignParams } from '@/domain/models/design';

export interface IDesignRepository {
  createDesign(projectId: string, params: CreateDesignParams): Promise<Design>;
  getDesign(designId: string): Promise<Design>;
  updateDesign(designId: string, params: UpdateDesignParams): Promise<Design>;
  deleteDesign(designId: string): Promise<void>;
  requestRender(designId: string): Promise<Design>;
}
