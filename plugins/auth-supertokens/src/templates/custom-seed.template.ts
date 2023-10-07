import { PrismaClient } from "@prisma/client";


export async function customSeed() {
  const client = new PrismaClient();
  const supertokensId = "";

  //replace this sample code to populate your database
  //with data that is required for your service to start
  await client.ENTITY_NAME.update({
    where: { SUPERTOKENS_ID_FIELD_NAME: supertokensId },
    data: {
      SUPERTOKENS_ID_FIELD_NAME: supertokensId,
    },
  });

  client.$disconnect();
}
