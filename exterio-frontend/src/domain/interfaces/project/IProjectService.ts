import type {
  Project,
  ProjectSummary,
  RateOverrides,
  RegionInput,
  ScaleReference,
} from '@/domain/models/project';

export interface IProjectService {
  listProjects(): Promise<ProjectSummary[]>;
  createProject(name: string): Promise<Project>;
  /** Creates a ready-made demo project (photo, regions, scale and a design). */
  createSampleProject(): Promise<Project>;
  getProject(projectId: string): Promise<Project>;
  renameProject(projectId: string, name: string): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
  /** Rejects with `ImageRejectedError` when the photo fails the quality check. */
  uploadImage(projectId: string, file: File): Promise<Project>;
  /** Replaces previously auto-detected regions with a fresh AI detection. */
  detectRegions(projectId: string): Promise<Project>;
  /** Full replace of the project's regions. */
  saveRegions(projectId: string, regions: RegionInput[]): Promise<Project>;
  saveScale(projectId: string, scale: ScaleReference): Promise<Project>;
  /** Full replace of the project's rate overrides. */
  saveRateOverrides(projectId: string, overrides: RateOverrides): Promise<Project>;
}
