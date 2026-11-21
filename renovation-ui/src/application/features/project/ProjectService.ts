import { ValidationError } from '@/application/shared/errors';
import { config } from '@/config';
import type { IProjectRepository, IProjectService } from '@/domain/interfaces/project';
import type {
  Project,
  ProjectSummary,
  RateOverride,
  RateOverrides,
  RegionInput,
  ScaleReference,
} from '@/domain/models/project';
import { describeScaleProblem } from '@/domain/utils/scale';

const MAX_NAME_LENGTH = 80;
const MIN_POLYGON_POINTS = 3;

export class ProjectService implements IProjectService {
  constructor(private readonly projectRepository: IProjectRepository) {}

  listProjects(): Promise<ProjectSummary[]> {
    return this.projectRepository.listProjects();
  }

  async createProject(name: string): Promise<Project> {
    return this.projectRepository.createProject(this.validateName(name));
  }

  createSampleProject(): Promise<Project> {
    return this.projectRepository.createSampleProject();
  }

  getProject(projectId: string): Promise<Project> {
    return this.projectRepository.getProject(projectId);
  }

  async renameProject(projectId: string, name: string): Promise<Project> {
    return this.projectRepository.renameProject(projectId, this.validateName(name));
  }

  deleteProject(projectId: string): Promise<void> {
    return this.projectRepository.deleteProject(projectId);
  }

  async uploadImage(projectId: string, file: File): Promise<Project> {
    const acceptedTypes: readonly string[] = config.upload.acceptedMimeTypes;
    if (!acceptedTypes.includes(file.type)) {
      throw new ValidationError('Please choose a JPG, PNG or WebP photo.');
    }
    if (file.size > config.upload.maxBytes) {
      const maxMb = Math.round(config.upload.maxBytes / (1024 * 1024));
      throw new ValidationError(`That photo is too large. Please choose one under ${maxMb} MB.`);
    }
    return this.projectRepository.uploadImage(projectId, file);
  }

  detectRegions(projectId: string): Promise<Project> {
    return this.projectRepository.detectRegions(projectId);
  }

  async saveRegions(projectId: string, regions: RegionInput[]): Promise<Project> {
    const cleaned = regions.map((region) => {
      const name = region.name.trim();
      if (!name) {
        throw new ValidationError('Every region needs a name.');
      }
      if (region.polygon.length < MIN_POLYGON_POINTS) {
        throw new ValidationError(`"${name}" needs at least ${MIN_POLYGON_POINTS} points.`);
      }
      if (!(region.surfaceMultiplier > 0)) {
        throw new ValidationError(`"${name}" needs a surface multiplier greater than zero.`);
      }
      return { ...region, name };
    });
    return this.projectRepository.saveRegions(projectId, cleaned);
  }

  async saveScale(projectId: string, scale: ScaleReference): Promise<Project> {
    const problem = describeScaleProblem(scale);
    if (problem) {
      throw new ValidationError(problem);
    }
    return this.projectRepository.saveScale(projectId, scale);
  }

  saveRateOverrides(projectId: string, overrides: RateOverrides): Promise<Project> {
    return this.projectRepository.saveRateOverrides(projectId, pruneOverrides(overrides));
  }

  private validateName(value: string): string {
    const name = value.trim();
    if (!name) {
      throw new ValidationError('Please give the project a name.');
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw new ValidationError(`Project names can be up to ${MAX_NAME_LENGTH} characters.`);
    }
    return name;
  }
}

/** Drops empty overrides so the server only stores rates the user actually changed. */
function pruneOverrides(overrides: RateOverrides): RateOverrides {
  const pruned: RateOverrides = {};
  for (const [materialId, override] of Object.entries(overrides)) {
    const entry: RateOverride = {};
    if (override.materialRate !== undefined) entry.materialRate = override.materialRate;
    if (override.labourRate !== undefined) entry.labourRate = override.labourRate;
    if (override.wastagePct !== undefined) entry.wastagePct = override.wastagePct;
    if (Object.keys(entry).length > 0) {
      pruned[materialId] = entry;
    }
  }
  return pruned;
}
