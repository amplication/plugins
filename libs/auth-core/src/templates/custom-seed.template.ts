import { PrismaClient } from "@prisma/client";

declare class ENTITY_NAME {}

export async function customSeed() {
  const client = new PrismaClient();
  const username = "admin";

  //replace this sample code to populate your database
  //with data that is required for your service to start
  await client.ENTITY_NAME.update({
    where: { username: username },
    data: {
      username,
    },
  });

  client.$disconnect();
}
