import {
  CreateEntityControllerBaseParams,
  DsgContext,
  EntityField,
  Module,
} from "@amplication/code-gen-types";
import { controllerMethodsIdsActionPairs } from "./create-method-id-action-entity-map";
import { templatesPath } from "../constants";
import { join } from "path";
import { print, Schema, Message, Method } from "protobuf-dsl";

const grpcProtoFilePath = join(templatesPath, "grpc.proto.template.proto");
export async function createGrpcProtoFile(
  context: DsgContext,
  eventParams: CreateEntityControllerBaseParams,
  relatedEntities: EntityField[]
): Promise<Module> {
  try {
    // const template = await readFile(grpcProtoFilePath);

    const { entityName, controllerBaseId, templateMapping, entity } =
      eventParams;
    const { serverDirectories } = context;

    const entitySchema: Schema = {
      service: {
        name: entityName,
        methods: [],
      },
      messages: [],
    };

    controllerMethodsIdsActionPairs(templateMapping, entity).forEach(
      ({ methodName, inputObjectName, outputObjectName }) => {
        const currentMethod: Method = {
          name: methodName,
          inputObjectName,
          outputObjectName,
        };

        entity.fields.forEach( x=>  {
          
        })

        entitySchema.messages.push({name:inputObjectName, fields:})

        entitySchema.service.methods.push(currentMethod);
      }
    );

    const file = await print(entitySchema);

    // relatedEntities &&
    //   relatedEntities.forEach((entity) => {
    //     controllerToManyMethodsIdsActionPairs(pascalCase(entity.name)).forEach(
    //       ({ methodId, methodName }) => {
    //         const classMethod = getClassMethodByIdName(
    //           classDeclaration,
    //           methodId
    //         );
    //         classMethod?.decorators?.push(
    //           buildGrpcMethodDecorator(entity.name, methodName)
    //         );
    //       }
    //     );
    //   });

    const fileName = `${entityName}.proto`;

    //const file = await fs.promises.readFile(grpcProtoFilePath, "utf-8");

    const filePath = `${serverDirectories.srcDirectory}/${entityName}/${fileName}`;

    return {
      code: file,
      path: filePath,
    };
  } catch (error) {
    console.error(error);
    return { code: "", path: "" };
  }
}
