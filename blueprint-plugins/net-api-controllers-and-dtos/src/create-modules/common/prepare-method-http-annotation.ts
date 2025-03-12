import { ModuleAction } from "@amplication/code-gen-types";
import { Annotation, CsharpSupport } from "@amplication/csharp-ast";
import { pascalCase } from "pascal-case";

// this function is for controller method property annotations, such as HttpGet, HttpPost, etc.
export function prepareMethodHttpAnnotations(action: ModuleAction): Annotation {
  return CsharpSupport.annotation({
    reference: CsharpSupport.classReference({
      name: `Http${action.restVerb}`,
      namespace: "Microsoft.AspNetCore.Mvc",
    }),
    argument: prepareAnnotationArgs(action.path!),
  });
}

function prepareAnnotationArgs(actionPath: string): string {
  const pathArr = actionPath.split("/").slice(1);
  const pathArrWithParams = pathArr.map((path) =>
    path.startsWith(":") ? `{${pascalCase(path.slice(1))}}` : path,
  );
  return `"${pathArrWithParams.join("/")}"`;
}
