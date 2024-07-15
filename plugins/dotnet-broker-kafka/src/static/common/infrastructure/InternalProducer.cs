using System.Text.Json;
using Confluent.Kafka;

namespace ServiceName.Brokers.Infrastructure;

public abstract class InternalProducer : IDisposable
{
    private readonly IProducer<string, string> _producer;

    protected InternalProducer(string bootstrapServers)
    {
        var config = new ProducerConfig { BootstrapServers = bootstrapServers };
        _producer = new ProducerBuilder<string, string>(config).Build();
    }

    /// <summary>
    ///     Asynchronously send a single message to a
    ///     Kafka topic. The partition the message is
    ///     sent to is determined by the partitioner
    ///     defined using the 'partitioner' configuration
    ///     property.
    /// </summary>
    /// <param name="topic">The topic to produce the message to.</param>
    /// <param name="messageKey">message key value.</param>
    /// <param name="message">The message to produce.</param>
    /// <param name="cancellationToken">
    ///     A cancellation token to observe whilst waiting
    ///     the returned task to complete.
    /// </param>
    /// <exception cref="ArgumentNullException"></exception>
    /// <returns>
    ///     A Task which will complete with a delivery
    ///     report corresponding to the produce request,
    ///     or an exception if an error occured.
    /// </returns>
    /// <exception cref="T:Confluent.Kafka.ProduceException`2">
    ///     Thrown in response to any produce request
    ///     that was unsuccessful for any reason
    ///     (excluding user application logic errors).
    ///     The Error property of the exception provides
    ///     more detailed information.
    /// </exception>
    /// <exception cref="T:System.ArgumentException">
    ///     Thrown in response to invalid argument values.
    /// </exception>
    public async Task ProduceAsync(string topic, object message, string? messageKey = null, CancellationToken cancellationToken = default)
    {
        if (topic == null) throw new ArgumentNullException(nameof(topic));
        if (message == null) throw new ArgumentNullException(nameof(message));
        var json = JsonSerializer.Serialize(message);
        Message<string, string> kafkaMessage = new() { Value = json };
        if (messageKey != null)
            kafkaMessage.Key = messageKey;
        await _producer.ProduceAsync(topic, kafkaMessage, cancellationToken);
    }

    /// <summary>
    /// Dispose the producer
    /// </summary>
    public void Dispose()
    {
        _producer.Dispose();
    }
}