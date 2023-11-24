// import { ConfigService } from "@nestjs/config";
// import { Params } from "nestjs-pino"

// ADDITIONAL_LOG_PROPERTIES_KEY

// export const LoggerConfiguration = (configService: ConfigService): Params => {
//     const logLevel = configService.get("LOG_LEVEL")
//     const serviceName = configService.get("SERVICE_NAME") ?? ""

//     return {
//         pinoHttp: {
//             level: logLevel,
//             mixin: () => ({ ...ADDITIONAL_LOG_PROPERTIES, serviceName })
//         }
//     }
// }