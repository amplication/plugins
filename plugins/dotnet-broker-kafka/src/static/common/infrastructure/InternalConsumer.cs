using Confluent.Kafka;
using Confluent.Kafka.Admin;

namespace ServiceName.Brokers.Infrastructure;

public class InternalConsumer : IDisposable
{
    private readonly string _topic;
    private Task? _consumerTask;
    private readonly ConsumerConfig _config;

    /// <summary>
    /// Handler for message received
    /// </summary>
    public event EventHandler<string> MessageReceived;

    public InternalConsumer(string topic, string groupId, string bootstrapServers)
    {
        _topic = topic;
        _config = new ConsumerConfig
        {
            GroupId = groupId,
            BootstrapServers = bootstrapServers,
            AutoOffsetReset = AutoOffsetReset.Earliest
        };
    }

    /// <summary>
    /// Create topic if not exists
    /// </summary>
    /// <returns></returns>
    public async Task CreateTopicIfNeeded()
    {
        using IAdminClient? adminClient = new AdminClientBuilder(_config).Build();
        try
        {
            await adminClient.CreateTopicsAsync([
                new TopicSpecification
                {
                    Name = _topic, ReplicationFactor = 1, NumPartitions = 1,

                }
            ]);
        }
        catch (CreateTopicsException e) when (e.Message.Contains("already exists")) { }
    }

    /// <summary>
    /// Start consume messages from topic asynchronously. make sure to set MessageReceived event before calling this method
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <exception cref="InvalidOperationException"> when no handler for message received is set </exception>
    public void StartConsume(CancellationToken cancellationToken)
    {
        if (MessageReceived == null)
            throw new InvalidOperationException("No handler for message received");
        _consumerTask = Task.Run(() => ConsumeMessages(cancellationToken), cancellationToken);
    }

    /// <summary>
    /// Dispose the consumer
    /// </summary>
    public void Dispose()
    {
        _consumerTask?.Dispose();
    }

    private Task ConsumeMessages(CancellationToken cancellationToken)
    {
        using var consumer = new ConsumerBuilder<string, string>(_config).Build();
        consumer.Subscribe(_topic);

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                cancellationToken.ThrowIfCancellationRequested();
                ConsumeResult<string, string>? consumeResult = consumer.Consume(cancellationToken);
                MessageReceived.Invoke(this, consumeResult.Message.Value);
            }
            catch (OperationCanceledException)
            {
                consumer.Close();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }
        }

        return Task.CompletedTask;
    }
}
