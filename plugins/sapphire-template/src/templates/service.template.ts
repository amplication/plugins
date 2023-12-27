import { Injectable } from "@nestjs/common";

@Injectable()
export class SERVICE {
  constructor(
    private findManyUseCase: FIND_MANY_USE_CASE,
    private findOneUseCase: FIND_ONE_USE_CASE,
    private createUseCase: CREATE_USE_CASE,
    private updateUseCase: UPDATE_USE_CASE,
    private deleteUseCase: DELETE_USE_CASE
  ) {}

  async findMany(args: FIND_MANY_ARGS): Promise<ENTITY[]> {
    return this.findManyUseCase.execute(args);
  }
  async findOne(args: FIND_ONE_ARGS): Promise<ENTITY | null> {
    return this.findOneUseCase.execute(args);
  }
  async create(args: CREATE_ARGS): Promise<ENTITY> {
    return this.createUseCase.execute(args);
  }
  async update(args: UPDATE_ARGS): Promise<ENTITY> {
    return this.updateUseCase.execute(args);
  }
  async delete(args: DELETE_ARGS): Promise<ENTITY> {
    return this.deleteUseCase.execute(args);
  }
}
