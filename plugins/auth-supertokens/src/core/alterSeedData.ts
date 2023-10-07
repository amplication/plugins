import { CreateSeedParams } from "@amplication/code-gen-types";
import { namedTypes } from "ast-types";

export const alterSeedData = (
    eventParams: CreateSeedParams
) => {
    const seedData = eventParams.templateMapping.DATA as namedTypes.ObjectExpression;
    seedData.properties = seedData.properties.filter((prop) => (
        !(prop.type === "ObjectProperty"
        && prop.key.type === "Identifier"
        && (
            prop.key.name === "username"
            || prop.key.name === "password"
        ))
    ));
}
