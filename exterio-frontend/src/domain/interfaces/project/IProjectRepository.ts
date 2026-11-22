import type {
  Project,
  ProjectSummary,
  RateOverrides,
  Region,
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
  /**
   * Auto-detect. Each part is handed to `onRegion` the moment the AI has written it; the
   * promise resolves with the project saved with all of them.
   */
  detectRegions(
    projectId: string,
    onRegion: (region: Region) => void,
    signal?: AbortSignal
  ): Promise<Project>;
  saveRegions(projectId: string, regions: RegionInput[]): Promise<Project>;
  saveScale(projectId: string, scale: ScaleReference): Promise<Project>;
  saveRateOverrides(projectId: string, overrides: RateOverrides): Promise<Project>;
}
