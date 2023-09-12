import { CreateMessageBrokerTopicsEnumParams, DsgContext, EnumMessagePatternConnectionOptions, ModuleMap } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { join } from "path";
import { name } from "../../package.json";
import * as utils from "../utils"
import RedisBrokerPlugin from "../index";


describe("Testing afterCreateMessageBrokerService hook", () => {
    let plugin: RedisBrokerPlugin;
    let context: DsgContext;
    let params: CreateMessageBrokerTopicsEnumParams;
    let moduleMap: ModuleMap;
    let topicsPath: string;

    beforeEach(() => {
        plugin = new RedisBrokerPlugin();
        context = fakeContext();
        params = mock<CreateMessageBrokerTopicsEnumParams>();
        topicsPath = join(context.serverDirectories.messageBrokerDirectory, "topics.ts")
        moduleMap = new ModuleMap(context.logger);
        moduleMap.set({
            code: utils.print(utils.parse(defaultTopicsEnumCode)).code,
            path: topicsPath
        });

    });
    it("should correctly add the necessary code in the topics enum file", async () => {
        const modules = await plugin.afterCreateMessageBrokerTopicsEnum(context, params, moduleMap);
        const topicsModule = modules.get(topicsPath);
        const topicsCode = utils.print(utils.parse(topicsModule.code)).code;
        console.log(topicsCode);
        console.log(expectedTopicsCode);
        expect(topicsCode).toStrictEqual(expectedTopicsCode);
    })
});

const defaultTopicsEnumCode = `export enum FirstMessageBrokerTopics {
  TheFirstTopicInTheFirstBroker = "theFirstTopicInTheFirstBroker",
  TheSecondTopicInTheFirstBroker = "theSecondTopicInTheFirstBroker",
}

export enum SecondMessageBrokerTopics {
  TheFirstTopicInTheSecondBroker = "theFirstTopicInTheSecondBroker",
}
`

const expectedTopicsCode = `export enum FirstMessageBrokerTopics {
  TheFirstTopicInTheFirstBroker = "theFirstTopicInTheFirstBroker",
  TheSecondTopicInTheFirstBroker = "theSecondTopicInTheFirstBroker",
}

export enum SecondMessageBrokerTopics {
  TheFirstTopicInTheSecondBroker = "theFirstTopicInTheSecondBroker",
}
export type AllMessageBrokerTopics = FirstMessageBrokerTopics | SecondMessageBrokerTopics;
`

const fakeContext = () => {
    return mock<DsgContext>({
        logger: {
            warn: async (message: string, params?: Record<string, unknown>, userFriendlyMessage?: string) => {
                console.log("Warning!", userFriendlyMessage);
            }
        },
        pluginInstallations: [{ npm: name }],
        serverDirectories: {
            messageBrokerDirectory: "/"
        },
        serviceTopics: [
            {
                id: 'first-broker-first-service-topic',
                enabled: true,
                messageBrokerId: 'first-broker-id',
                patterns: [
                    {
                        topicId: "first-service-topic-first-topic",
                        topicName: "firstBrokerFirstServiceTopicFirstTopic",
                        type: EnumMessagePatternConnectionOptions.Receive
                    },
                    {
                        topicId: "first-service-topic-second-topic",
                        topicName: "firstBrokerFirstServiceTopicSecondTopic",
                        type: EnumMessagePatternConnectionOptions.Receive
                    }
                ]
            },
            {
                id: 'second-broker-first-service-topic',
                enabled: true,
                messageBrokerId: 'second-broker-id',
                patterns: [
                    {
                    topicId: "second-service-topic-first-topic",
                    topicName: "firstBrokerFirstServiceTopicFirstTopic",
                    type: EnumMessagePatternConnectionOptions.Receive
                    }
                ]
            }
        ],
        otherResources: [
            {
                "resourceType": "MessageBroker",
                "buildId": "abuildid",
                "pluginInstallations": [],
                "roles": [],
                "entities": [],
                "topics": [
                    {
                        "resourceId": "first-broker-first-topic",
                        "id": "first-service-topic-first-topic",
                        "name": "theFirstTopicInTheFirstBroker"
                    },
                    {
                        "resourceId": "first-broker-second-topic",
                        "id": "first-service-topic-second-topic",
                        "name": "theSecondTopicInTheFirstBroker"
                    }
                ],
                "resourceInfo": {
                    "name": "firstMessageBroker",
                    "description": "This resource is used to store project configuration.",
                    "version": "1.0",
                    "id": "first-broker-id",
                    "url": "http://localhost:3000/first-broker-id"
                }
            },
            {
                "resourceType": "MessageBroker",
                "buildId": "abuildid",
                "pluginInstallations": [],
                "roles": [],
                "entities": [],
                "topics": [
                    {
                        "resourceId": "second-broker-first-topic",
                        "id": "second-service-topic-first-topic",
                        "name": "theFirstTopicInTheSecondBroker"
                    }
            ], 
                "resourceInfo": {
                    "name": "secondMessageBroker",
                    "description": "This resource is used to store project configuration.",
                    "version": "1.0",
                    "id": "second-broker-id",
                    "url": "http://localhost:3000/second-broker-id"
                }
            }
        ]
    });
}
