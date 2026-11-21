import { ValidationError } from '@/application/shared/errors';
import type { IDesignRepository, IDesignService } from '@/domain/interfaces/design';
import type { CreateDesignParams, Design, UpdateDesignParams } from '@/domain/models/design';

const MAX_NAME_LENGTH = 60;

export class DesignService implements IDesignService {
  constructor(private readonly designRepository: IDesignRepository) {}

  async createDesign(projectId: string, params: CreateDesignParams): Promise<Design> {
    return this.designRepository.createDesign(projectId, {
      ...params,
      name: this.validateName(params.name),
    });
  }

  getDesign(designId: string): Promise<Design> {
    return this.designRepository.getDesign(designId);
  }

  async updateDesign(designId: string, params: UpdateDesignParams): Promise<Design> {
    const payload: UpdateDesignParams = { ...params };
    if (params.name !== undefined) {
      payload.name = this.validateName(params.name);
    }
    return this.designRepository.updateDesign(designId, payload);
  }

  deleteDesign(designId: string): Promise<void> {
    return this.designRepository.deleteDesign(designId);
  }

  requestRender(designId: string): Promise<Design> {
    return this.designRepository.requestRender(designId);
  }

  private validateName(value: string): string {
    const name = value.trim();
    if (!name) {
      throw new ValidationError('Please give the design a name.');
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw new ValidationError(`Design names can be up to ${MAX_NAME_LENGTH} characters.`);
    }
    return name;
  }
}
