export interface IUseCase<Tin, Tout> {
  execute(input: Tin): Promise<Tout>;
}
