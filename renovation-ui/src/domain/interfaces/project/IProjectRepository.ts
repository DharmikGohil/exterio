import type {
  Project,
  ProjectSummary,
  RateOverrides,
  RegionInput,
  ScaleReference,
} from '@/domain/models/project';

export interface IProjectRepository {
  listProjects(): Promise<ProjectSummary[]>;
  createProject(name: string): Promise<Project>;
  createSampleProject(): Promise<Project>;
  getProject(projectId: string): Promise<Project>;
  renameProject(projectId: string, name: string): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
  uploadImage(projectId: string, file: File): Promise<Project>;
  detectRegions(projectId: string): Promise<Project>;
  saveRegions(projectId: string, regions: RegionInput[]): Promise<Project>;
  saveScale(projectId: string, scale: ScaleReference): Promise<Project>;
  saveRateOverrides(projectId: string, overrides: RateOverrides): Promise<Project>;
}
