namespace ServiceName.Brokers.Infrastructure;

/// <summary>
/// set the topic name for the method. will be used to subscribe to the topic.
/// </summary>
/// <param name="name"></param>
[AttributeUsage(AttributeTargets.Method, Inherited = false, AllowMultiple = false)]
public sealed class TopicAttribute(string name) : Attribute
{
    /// <summary>
    /// Name of the topic.
    /// </summary>
    public string Name { get; } = name;
}