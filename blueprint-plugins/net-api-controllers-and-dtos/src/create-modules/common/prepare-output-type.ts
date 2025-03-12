import { PropertyTypeDef } from "@amplication/code-gen-types";
import { CsharpSupport, Type } from "@amplication/csharp-ast";
import { getEnumDtoName, getEnumDtoNamespace, getPropertyType } from "./";

export function prepareOutputType(
  resourceName: string,
  moduleName: string,
  outputType: PropertyTypeDef,
): Type | undefined {
  // this line is needed only for now, as we don't get the action.inputType of an entity action
  if (!outputType) return;

  let outputTypeName: string;
  if (outputType.type === "Dto") {
    outputTypeName = getEnumDtoName(outputType.dto!);

    return CsharpSupport.Types.reference(
      CsharpSupport.classReference({
        name: outputTypeName,
        namespace: getEnumDtoNamespace(
          resourceName,
          moduleName,
          outputType.dto!,
        ),
      }),
    );
  }

  if (outputType.type === "Enum") {
    throw new Error(
      "Enum type is not supported. Currently handled as a Dto type.",
    );
  }

  const propertyType = getPropertyType(outputType);
  outputTypeName = propertyType.toString();
  return getPropertyType(outputType);
}
