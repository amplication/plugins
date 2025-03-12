import { ModuleAction, PropertyTypeDef } from "@amplication/code-gen-types";
import { CsharpSupport } from "@amplication/csharp-ast";
import {
  getEnumDtoName,
  getEnumDtoNamespace,
  getPropertyType,
  prepareInputParamAnnotations,
} from ".";
import { camelCase } from "camel-case";
import { Annotation } from "@amplication/csharp-ast";
import { Type } from "@amplication/csharp-ast";

type MethodParamsMeta = {
  inputTypeName: string;
  paramName: string;
  parameter: {
    name: string;
    type: Type;
    annotations: {
      restAnnotations: Annotation[];
      gqlAnnotations: Annotation[];
    };
  };
};

export function prepareInputParameters(
  resourceName: string,
  moduleName: string,
  action: ModuleAction,
): MethodParamsMeta[] {
  // this line is needed only for now, as we don't get the action.inputType of an entity action
  if (!action.inputType) return [];

  const methodParams: MethodParamsMeta[] = [];
  // create a list of properties to mimic the future implementation where we will have multiple function parameters
  const inputParameters: PropertyTypeDef[] = [];
  inputParameters.push(action.inputType);

  for (const inputParam of inputParameters) {
    let inputTypeName: string;
    let paramName: string;

    if (inputParam.type === "Dto") {
      inputTypeName = inputParam.dto?.name ?? "";
      paramName = `${camelCase(inputTypeName)}Dto`;

      const currentParamMeta = {
        inputTypeName,
        paramName,
        parameter: {
          name: paramName,
          type: CsharpSupport.Types.reference(
            CsharpSupport.classReference({
              name: getEnumDtoName(inputParam.dto!),
              namespace: getEnumDtoNamespace(
                resourceName,
                moduleName,
                inputParam.dto!,
              ),
            }),
          ),
          annotations: prepareInputParamAnnotations(action),
        },
      };

      methodParams.push(currentParamMeta);
    } else if (inputParam.type === "Enum") {
      throw new Error(
        "Enum type is not supported. Currently handled as a Dto type.",
      );
    } else {
      // all the other types (Integer, Float, String, Boolean, DateTime)
      const propertyType = getPropertyType(inputParam);
      inputTypeName = propertyType.toString();
      paramName = "data"; // TODO: Use a better name(?!)
      const currentParamMeta = {
        inputTypeName,
        paramName,
        parameter: {
          name: paramName,
          type: propertyType,
          annotations: prepareInputParamAnnotations(action),
        },
      };

      methodParams.push(currentParamMeta);
    }
  }

  return methodParams;
}
