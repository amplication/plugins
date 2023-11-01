import { ConfigService } from "@nestjs/config"
import { generateRabbitMQClientOptions } from "./generateRabbitMQClientOptions"
import { mock } from "jest-mock-extended"

describe("Testing the RabbitMQ Plugin", () => {
    let ConfigService: ConfigService

    describe("Testing the Generate RabbitMQ Client Options", () => {
        beforeEach(() => {
            ConfigService = mock<ConfigService>()
        })
        it("should work since we return a mock value", () => {
            let configGet = (ConfigService.get as jest.Mock)
            configGet.mockReset()
            configGet.mockReturnValue("Test")
            generateRabbitMQClientOptions(ConfigService);
            expect(configGet.mock.calls.length).toBe(2)
            expect(configGet.mock.calls[0][0]).toBe("RABBITMQ_URLS")
            expect(configGet.mock.calls[1][0]).toBe("RABBITMQ_QUEUE")
        })

        it("should throw an error", () => {
            let configGet = (ConfigService.get as jest.Mock)
            configGet.mockReset()
            
            expect(() => generateRabbitMQClientOptions(ConfigService))
                .toThrowError("RABBITMQ_URLS environment variable must be defined")
            expect(configGet.mock.calls.length).toBe(2)
            expect(configGet.mock.calls[0][0]).toBe("RABBITMQ_URLS")
            expect(configGet.mock.calls[1][0]).toBe("RABBITMQ_QUEUE")
        })
    })
})