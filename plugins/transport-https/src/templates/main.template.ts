import { Logger, ValidationPipe } from "@nestjs/common";
import {
  AbstractHttpAdapter,
  HttpAdapterHost,
  NestFactory,
} from "@nestjs/core";
import { OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { HttpExceptionFilter } from "./filters/HttpExceptions.filter";
import { AppModule } from "./app.module";
import { connectMicroservices } from "./connectMicroservices";
import {
  swaggerPath,
  swaggerDocumentOptions,
  swaggerSetupOptions,
} from "./swagger";
import fs from "fs";
import { HttpsOptions } from "@nestjs/common/interfaces/external/https-options.interface";
import https from "https";
import http from "http";
import express from "express";
import { ExpressAdapter } from "@nestjs/platform-express";

const {
  PORT = 3000,
  HTTPS_PORT = 443,
  APP_MODE,
  SSL_CERT_PATH,
  SSL_KEY_PATH,
  SSL_CA_PATH,
} = process.env;

const httpsOptions: HttpsOptions = {
  cert: SSL_CERT_PATH && fs.readFileSync(SSL_CERT_PATH),
  key: SSL_KEY_PATH && fs.readFileSync(SSL_KEY_PATH),
  ca: SSL_CA_PATH && fs.readFileSync(SSL_CA_PATH),
};

function getHttpsServer(
  server: express.Express,
  httpsOptions: HttpsOptions,
  APP_MODE: string | undefined
) {
  switch (APP_MODE) {
    case "http":
      return { cors: true };
    case "https":
      return { httpsOptions, cors: true };
    case "both":
      return new ExpressAdapter(server);
    default:
      throw new Error(`APP_MODE ${APP_MODE} is not supported`);
  }
}

async function main() {
  const server = express();
  const app = await NestFactory.create(
    AppModule,
    getHttpsServer(server, httpsOptions, APP_MODE) as AbstractHttpAdapter
  );

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: false,
    })
  );

  //This fix is based on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };

  const document = SwaggerModule.createDocument(app, swaggerDocumentOptions);

  /** check if there is Public decorator for each path (action) and its method (findMany / findOne) on each controller */
  Object.values((document as OpenAPIObject).paths).forEach((path: any) => {
    Object.values(path).forEach((method: any) => {
      if (
        Array.isArray(method.security) &&
        method.security.includes("isPublic")
      ) {
        method.security = [];
      }
    });
  });

  await connectMicroservices(app);
  await app.startAllMicroservices();

  SwaggerModule.setup(swaggerPath, app, document, swaggerSetupOptions);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapter));

  await app.init();

  if (APP_MODE === "both") {
    Logger.log(`🚀 Running both http and https server`, "NestApplication");
    // create both http and https server
    http.createServer(server).listen(PORT);
    https.createServer(httpsOptions, server).listen(HTTPS_PORT);
  } else {
    Logger.log(`🚀 Running ${APP_MODE || "http"} server`, "NestApplication");
    await app.listen(PORT);
  }

  return app;
}

module.exports = main();
