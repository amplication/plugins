import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  Module,
} from "@amplication/code-gen-types";
import { imageNameKey, registryKey, registryPathKey, serviceNameKey } from "./constants";
import { EventNames } from "@amplication/code-gen-types";
import { resolve } from "path";

class GithubActionsPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        after: this.afterCreateServer,
      },
    };
  }

  async afterCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: Module[]
  ) {
    context.logger.info(`Generating Github Actions workflow...`);

    // determine the name of the service which will be used as the name for the workflow
    // workflow names must be lower case letters and numbers. words may be separated with dashes (-):
    const serviceName = context.resourceInfo?.name
      .toLocaleLowerCase()
      .replaceAll(/[^a-zA-Z0-9-]/g, "-");

    if (!serviceName) {
      throw new Error("Service name is undefined");
    }

    const staticPath = resolve(__dirname, "./static");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      "./"
    );

    let dockerMetaDataStep = `
    - name: docker metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ REGISTRY }}/${{ PATH }}/${{ IMAGE_NAME }}
        flavor: latest=true
        tags: |
          type=ref,event=branch
          type=semver,pattern={{version}}
    `;

    dockerMetaDataStep
      .replace(registryKey, "")
      .replace(registryPathKey, "")
      .replace(imageNameKey, "");

    let dockerContainerRepositoryLoginStep =`
    - name: login to image repostiory
      uses: docker/login-action@v2
      with:
        registry: ""
        username: ${{ github.actor }}
        password: ${{ secrets.REGISTRY_TOKEN }}
    `;

    dockerContainerRepositoryLoginStep
      .replace(registryKey, "");

    let dockerBuildAndPushStep = `
    - name: Build and push
      uses: docker/build-push-action@v3
      with:
        context: .
        file: ${{ SERVER_WORKING_DIRECTORY }}/Dockerfile
        push: ${{ github.ref_type == 'tag' }}
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
    `;

    const renderdOutput = staticsFiles.map(
      (file): Module => ({
        path: file.path.replace("workflow.yaml", serviceName + ".yaml"),
        code: file.code
        .replaceAll(serviceNameKey, serviceName),
      })
    );

    return [...modules, ...renderdOutput];
  }
}

export default GithubActionsPlugin;
