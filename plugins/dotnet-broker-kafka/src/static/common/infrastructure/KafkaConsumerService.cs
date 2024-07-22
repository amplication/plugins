using System.Reflection;
using System.Text.Json;

namespace ServiceName.Brokers.Infrastructure;

public abstract class KafkaConsumerService<T> : BackgroundService
{
    private readonly Dictionary<string, MethodInfo> _topicMethodMappings = new();
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly KafkaOptions _kafkaOptions;

    protected KafkaConsumerService(
        IServiceScopeFactory serviceScopeFactory,
        KafkaOptions kafkaOptions
    )
    {
        _kafkaOptions = kafkaOptions;
        _serviceScopeFactory = serviceScopeFactory;
        _kafkaOptions = kafkaOptions;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        LoadTopicMappings();
        foreach (var topic in _topicMethodMappings.Keys)
        {
            InternalConsumer internalConsumer =
                new(topic, _kafkaOptions.ConsumerGroupId, _kafkaOptions.BootstrapServers);
            internalConsumer.MessageReceived += (sender, message) =>
            {
                using var scope = _serviceScopeFactory.CreateScope();
                MethodInfo methodInfo = _topicMethodMappings[topic];
                object kafkaControllerInstance = scope.ServiceProvider.GetRequiredService(
                    methodInfo.DeclaringType
                );
                methodInfo.Invoke(kafkaControllerInstance, [JsonSerializer.Serialize(message)]);
            };

            await internalConsumer.CreateTopicIfNeeded();
            internalConsumer.StartConsume(stoppingToken);
        }
    }

    private void LoadTopicMappings()
    {
        var methods = typeof(T)
            .GetMethods()
            .Where(m => m.GetCustomAttributes<TopicAttribute>().Any());
        foreach (var method in methods)
        {
            var topic = method.GetCustomAttribute<TopicAttribute>();
            _topicMethodMappings.Add(topic.Name, method);
        }
    }
}
