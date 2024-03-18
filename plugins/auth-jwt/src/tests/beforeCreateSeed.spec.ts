import { CreateSeedParams, DsgContext } from "@amplication/code-gen-types";
import { parse } from "@amplication/code-gen-utils";
import { mock } from "jest-mock-extended";
import { prettyPrint } from "recast";
import { name } from "../../package.json";
import { beforeCreateSeed } from "../events/createSeed";

describe("Testing beforeCreateSeed hook", () => {
  let context: DsgContext;
  let params: CreateSeedParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
      resourceInfo: {
        settings: {
          authEntityName: "TheAuthEntity",
        },
      },
      entities: [{ name: "TheAuthEntity" }],
    });
    params = {
      ...mock<CreateSeedParams>(),
      template: parse(initialTemplate),
      templateMapping: {},
    };
  });

  it("should correctly alter the template", async () => {
    const { template } = await beforeCreateSeed(context, params);
    const code = prettyPrint(template).code;
    const expectedCode = prettyCode(correctOutputTemplate);
    expect(code).toStrictEqual(expectedCode);
  });
});

const initialTemplate = `
if (require.main === module) {
  dotenv.config();

  const { BCRYPT_SALT } = process.env;

  if (!BCRYPT_SALT) {
    throw new Error("BCRYPT_SALT environment variable must be defined");
  }
}

async function seed() {
  console.info("Seeding database...");

  const client = new PrismaClient();
  void client.$disconnect();

  console.info("Seeding database with custom seed...");
  customSeed();

  console.info("Seeded database successfully");
}
`;

const correctOutputTemplate = `
import { Salt, parseSalt } from "../src/auth/password.service";
import { hash } from "bcrypt";

if (require.main === module) {
  dotenv.config();

  const { BCRYPT_SALT } = process.env;

  if (!BCRYPT_SALT) {
    throw new Error("BCRYPT_SALT environment variable must be defined");
  }

  const salt = parseSalt(BCRYPT_SALT);
    seed(salt).catch(error => {
        console.error(error);
        process.exit(1);
    });
}

async function seed(bcryptSalt: Salt) {
  console.info("Seeding database...");

  const client = new PrismaClient();
  const data = DATA;
    
    await client.theauthentity.upsert({
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
`;

const prettyCode = (code: string) => prettyPrint(parse(code)).code;
