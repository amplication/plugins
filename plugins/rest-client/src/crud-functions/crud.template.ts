import { Axios } from "axios";

export class DELEGATE_NAME {
  private readonly path: string;
  constructor(protected axios: Axios) {
    //@ts-ignore
    this.path = PATH;
  }

  async view() {
    const response = await this.axios.get(this.path);
    return response.data;
  }

  async create() {
    const response = await this.axios.post(this.path);
    return response.data;
  }

  async search() {
    const response = await this.axios.get(this.path);
    return response.data;
  }

  async update() {
    const response = await this.axios.patch(this.path);
    return response.data;
  }

  async delete() {
    const response = await this.axios.delete(this.path);
    return response.data;
  }
}
