export const DOCKER_SERVICE_KAFKA_NAME = "kafka";
export const DOCKER_SERVICE_ZOOKEEPER_NAME = "zookeeper";
export const DOCKER_SERVICE_ZOOKEEPER_PORT = "2181";
export const DOCKER_SERVICE_KAFKA_PORT = "9092";
export const DOCKER_SERVICE_KAFKA_UI_NAME = "kafka-ui";

export const updateDockerComposeDevProperties = {
  services: {
    [DOCKER_SERVICE_ZOOKEEPER_NAME]: {
      image: "confluentinc/cp-zookeeper:5.2.4",
      environment: {
        ZOOKEEPER_CLIENT_PORT: 2181,
        ZOOKEEPER_TICK_TIME: 2000,
      },
      ports: [
        `${DOCKER_SERVICE_ZOOKEEPER_PORT}:${DOCKER_SERVICE_ZOOKEEPER_PORT}`,
      ],
    },
    [DOCKER_SERVICE_KAFKA_NAME]: {
      image: "confluentinc/cp-kafka:7.3.1",
      depends_on: [DOCKER_SERVICE_ZOOKEEPER_NAME],
      ports: ["9092:9092", "9997:9997"],
      environment: {
        KAFKA_BROKER_ID: 1,
        KAFKA_ZOOKEEPER_CONNECT: `${DOCKER_SERVICE_ZOOKEEPER_NAME}:${DOCKER_SERVICE_ZOOKEEPER_PORT}`,
        KAFKA_ADVERTISED_LISTENERS: `PLAINTEXT://${DOCKER_SERVICE_KAFKA_NAME}:29092,PLAINTEXT_HOST://localhost:${DOCKER_SERVICE_KAFKA_PORT}`,
        KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: `PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT`,
        KAFKA_INTER_BROKER_LISTENER_NAME: `PLAINTEXT`,
        KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1,
        KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1,
        KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1,
      },
    },
    [DOCKER_SERVICE_KAFKA_UI_NAME]: {
      container_name: DOCKER_SERVICE_KAFKA_UI_NAME,
      image: "provectuslabs/kafka-ui:latest",
      ports: ["8080:8080"],
      depends_on: [DOCKER_SERVICE_ZOOKEEPER_NAME, DOCKER_SERVICE_KAFKA_NAME],
      environment: {
        KAFKA_CLUSTERS_0_NAME: "local",
        KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: "kafka:29092",
        KAFKA_CLUSTERS_0_ZOOKEEPER: "zookeeper:2181",
        KAFKA_CLUSTERS_0_JMXPORT: 9997,
      },
    },
  },
};
export const SERVICE_INSTALLER_METHOD_CODE_BLOCK = `
var kafkaOptions = app.Configuration.GetSection("kafka").Get<KafkaOptions>();
if (kafkaOptions == null)
    throw new Exception("KafkaOptions not found in configuration section [messageBrokerName]");
if (kafkaOptions.ConsumerGroupId == null)
    throw new Exception("ConsumerGroupId not found in configuration section [messageBrokerName]");
if (kafkaOptions.BootstrapServers == null)
    throw new Exception("BootstrapServers not found in configuration section [messageBrokerName]");
return app.Services.AddHostedService(x => new [messageBrokerName]ConsumerService(x.GetRequiredService<IServiceScopeFactory>(), kafkaOptions))
    .AddSingleton(x => new [messageBrokerName]ProducerService(kafkaOptions.BootstrapServers))
    .AddScoped<[messageBrokerName]MessageHandlersController>();`;
