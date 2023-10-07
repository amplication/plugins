import { ModuleMap, BuildLogger } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { prettyCode } from "../utils";
import { alterSeedCode } from "./alterSeedCode";

const modules = new ModuleMap(mock<BuildLogger>());
const scriptsDirectory = "scripts";

describe("alterSeedCode tests", () => {
    beforeEach(() => {
        modules.set({
            path: `${scriptsDirectory}/seed.ts`,
            code: initialSeedCode
        });
    })
    it("should change the where arg from username to supertokensId", () => {
        alterSeedCode(scriptsDirectory, modules);
        const code = prettyCode(modules.get(`${scriptsDirectory}/seed.ts`).code);
        const expectedCode = prettyCode(expectedSeedCode);
        expect(code).toStrictEqual(expectedCode);
    })
})

const initialSeedCode = `async function seed(bcryptSalt: Salt) {
    console.info("Seeding database...");

    const client = new PrismaClient();

    const data = {
        roles: ["user"],
        supertokensId: ""
    };

    await client.user.upsert({
        where: {
            username: data.username
        },

        update: {},
        create: data
    });

    void client.$disconnect();

    console.info("Seeding database with custom seed...");
    customSeed();

    console.info("Seeded database successfully");
}
`

const expectedSeedCode = `async function seed(bcryptSalt: Salt) {
  console.info("Seeding database...");

  const client = new PrismaClient();

  const data = {
    roles: ["user"],
    supertokensId: "",
  };

  await client.user.upsert({
    where: {
      supertokensId: data.supertokensId,
    },

    update: {},
    create: data,
  });

  void client.$disconnect();

  console.info("Seeding database with custom seed...");
  customSeed();

  console.info("Seeded database successfully");
}
`
