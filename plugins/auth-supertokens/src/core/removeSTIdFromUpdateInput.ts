import { NamedClassDeclaration } from "@amplication/code-gen-types";
import { SUPERTOKENS_ID_FIELD_NAME } from "../constants";

export const removeSTIdFromUpdateInput = (updateInput: NamedClassDeclaration) => {
    updateInput.body.body = updateInput.body.body.filter((stmt) => (
        !(stmt.type === "ClassProperty"
        && stmt.key.type === "Identifier"
        && stmt.key.name === SUPERTOKENS_ID_FIELD_NAME)
    ))
}
