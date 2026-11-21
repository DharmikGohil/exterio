import { ImageRejectedError } from '@/application/features/project/errors';
import type { IProjectRepository } from '@/domain/interfaces/project';
import type {
  Project,
  ProjectSummary,
  QualityReport,
  RateOverrides,
  RegionInput,
  ScaleReference,
} from '@/domain/models/project';
import type { ApiError } from '@/infrastructure/utils/http/ApiError';

import { BaseRepository } from '../BaseRepository';

enum ProjectErrorCode {
  IMAGE_REJECTED = 'IMAGE_002',
}

const IMAGE_FIELD = 'file';

function isQualityReport(value: unknown): value is QualityReport {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<QualityReport>;
  return (
    typeof candidate.usable === 'boolean' &&
    typeof candidate.score === 'number' &&
    Array.isArray(candidate.issues) &&
    Array.isArray(candidate.guidance)
  );
}

export class ProjectRepository extends BaseRepository implements IProjectRepository {
  listProjects(): Promise<ProjectSummary[]> {
    return this.execute(() => this.httpClient.get<ProjectSummary[]>('/api/projects'));
  }

  createProject(name: string): Promise<Project> {
    return this.execute(() => this.httpClient.post<Project>('/api/projects', { name }));
  }

  createSampleProject(): Promise<Project> {
    return this.execute(() => this.httpClient.post<Project>('/api/projects/sample'));
  }

  getProject(projectId: string): Promise<Project> {
    return this.execute(() => this.httpClient.get<Project>(this.projectUrl(projectId)));
  }

  renameProject(projectId: string, name: string): Promise<Project> {
    return this.execute(() => this.httpClient.patch<Project>(this.projectUrl(projectId), { name }));
  }

  deleteProject(projectId: string): Promise<void> {
    return this.execute(() => this.httpClient.delete<void>(this.projectUrl(projectId)));
  }

  uploadImage(projectId: string, file: File): Promise<Project> {
    const formData = new FormData();
    formData.append(IMAGE_FIELD, file);
    return this.execute(() =>
      this.httpClient.post<Project>(`${this.projectUrl(projectId)}/image`, formData)
    );
  }

  detectRegions(projectId: string): Promise<Project> {
    return this.execute(() =>
      this.httpClient.post<Project>(`${this.projectUrl(projectId)}/regions/detect`)
    );
  }

  saveRegions(projectId: string, regions: RegionInput[]): Promise<Project> {
    return this.execute(() =>
      this.httpClient.put<Project>(`${this.projectUrl(projectId)}/regions`, { regions })
    );
  }

  saveScale(projectId: string, scale: ScaleReference): Promise<Project> {
    return this.execute(() =>
      this.httpClient.put<Project>(`${this.projectUrl(projectId)}/scale`, scale)
    );
  }

  saveRateOverrides(projectId: string, overrides: RateOverrides): Promise<Project> {
    return this.execute(() =>
      this.httpClient.put<Project>(`${this.projectUrl(projectId)}/rates`, { overrides })
    );
  }

  protected override handleErrorCode(error: ApiError): Error | null {
    if (error.code === ProjectErrorCode.IMAGE_REJECTED) {
      const quality = error.details?.quality;
      return new ImageRejectedError(error.message, isQualityReport(quality) ? quality : null);
    }
    return null;
  }

  private projectUrl(projectId: string): string {
    return `/api/projects/${encodeURIComponent(projectId)}`;
  }
}
