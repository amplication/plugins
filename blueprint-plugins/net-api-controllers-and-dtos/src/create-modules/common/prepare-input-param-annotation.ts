import {
  EnumModuleActionRestInputSource,
  ModuleAction,
} from "@amplication/code-gen-types";
import { Annotation, CsharpSupport } from "@amplication/csharp-ast";

// this function is for controller method property annotations, such as FromRoute, FromBody, etc.
export function prepareInputParamAnnotations(action: ModuleAction): {
  restAnnotations: Annotation[];
  gqlAnnotations: Annotation[];
} {
  const annotations: {
    restAnnotations: Annotation[];
    gqlAnnotations: Annotation[];
  } = {
    restAnnotations: [],
    gqlAnnotations: [],
  };

  // at this time, the restInputSource or the gqlOperation always related to the one input type that we have
  // and it is also on the action level and not coupled to the current property (method parameter)
  // Therefore, the annotation that we return here is always the same for all properties (for now we have only one so it in not a problem)
  if (
    action.restInputSource &&
    action.restInputSource !== EnumModuleActionRestInputSource.Split
  ) {
    const inputName =
      action.restInputSource === EnumModuleActionRestInputSource.Params
        ? "FromRoute"
        : `From${action.restInputSource}`;
    annotations.restAnnotations.push(
      CsharpSupport.annotation({
        reference: CsharpSupport.classReference({
          name: inputName,
          namespace: "Microsoft.AspNetCore.Mvc",
        }),
      })
    );
  }
  return annotations;
}
