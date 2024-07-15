namespace ServiceName.Brokers.Infrastructure;

/// <summary>
/// Represents the Kafka options.
/// </summary>
public class KafkaOptions
{
    /// <summary>
    /// Kafka bootstrap servers.
    /// </summary>
    public string BootstrapServers { get; set; } = null!;

    /// <summary>
    /// Kafka consumer group id.
    /// </summary>
    public string? ConsumerGroupId { get; set; }
}