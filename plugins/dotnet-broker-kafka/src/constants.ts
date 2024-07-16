export const DOCKER_SERVICE_KAFKA_NAME = "kafka";
export const DOCKER_SERVICE_KAFKA_PORT = "9092";
export const updateDockerComposeDevProperties = {
  services: {},
};

export const SERVICE_INSTALLER_METHOD_CODE_BLOCK = `
var kafkaOptions = app.Configuration.GetSection("[messageBrokerName]").Get<KafkaOptions>();
if (kafkaOptions == null)
    throw new Exception("KafkaOptions not found in configuration section [messageBrokerName]");
if (kafkaOptions.ConsumerGroupId == null)
    throw new Exception("ConsumerGroupId not found in configuration section [messageBrokerName]");
if (kafkaOptions.BootstrapServers == null)
    throw new Exception("BootstrapServers not found in configuration section [messageBrokerName]");
return app.Services.AddHostedService(x => new [messageBrokerName]ConsumerService(x.GetRequiredService<IServiceScopeFactory>(), kafkaOptions))
    .AddSingleton(x => new [messageBrokerName]ProducerService(kafkaOptions.BootstrapServers))
    .AddScoped<[messageBrokerName]MessageHandlersController>();`;
