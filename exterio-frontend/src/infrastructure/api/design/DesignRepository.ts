import type { IDesignRepository } from '@/domain/interfaces/design';
import type { CreateDesignParams, Design, UpdateDesignParams } from '@/domain/models/design';

import { BaseRepository } from '../BaseRepository';

export class DesignRepository extends BaseRepository implements IDesignRepository {
  createDesign(projectId: string, params: CreateDesignParams): Promise<Design> {
    return this.execute(() =>
      this.httpClient.post<Design>(`/api/projects/${encodeURIComponent(projectId)}/designs`, params)
    );
  }

  getDesign(designId: string): Promise<Design> {
    return this.execute(() => this.httpClient.get<Design>(this.designUrl(designId)));
  }

  updateDesign(designId: string, params: UpdateDesignParams): Promise<Design> {
    return this.execute(() => this.httpClient.put<Design>(this.designUrl(designId), params));
  }

  deleteDesign(designId: string): Promise<void> {
    return this.execute(() => this.httpClient.delete<void>(this.designUrl(designId)));
  }

  requestRender(designId: string): Promise<Design> {
    return this.execute(() => this.httpClient.post<Design>(`${this.designUrl(designId)}/render`));
  }

  private designUrl(designId: string): string {
    return `/api/designs/${encodeURIComponent(designId)}`;
  }
}
