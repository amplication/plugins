import { PropertyTypeDef } from "@amplication/code-gen-types";
import { Type } from "@amplication/csharp-ast";
import { CsharpSupport } from "@amplication/csharp-ast";

export function getPropertyType(property: PropertyTypeDef): Type {
  switch (property.type) {
    case "Integer": {
      return CsharpSupport.Types.integer();
    }

    case "Float": {
      return CsharpSupport.Types.double();
    }

    case "String": {
      return CsharpSupport.Types.string();
    }

    case "Boolean": {
      return CsharpSupport.Types.boolean();
    }

    case "DateTime": {
      return CsharpSupport.Types.dateTime();
    }

    case "Json": {
      throw new Error("Json type is not supported");
    }

    // TODO: Add support for these types: id/decimal/bigint/lookup and more from EnumDataType
    default: {
      return CsharpSupport.Types.string();
    }
  }
}
