using System.Collections.Concurrent;

namespace Platform.WebAPI.Security;

public interface ILoginAttemptService
{
    bool IsBlocked(string remoteIp, out int retryAfterSeconds);
    void RegisterFailure(string remoteIp);
    void Reset(string remoteIp);
}

public sealed class InMemoryLoginAttemptService : ILoginAttemptService
{
    private static readonly TimeSpan FailureWindow = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan BlockDuration = TimeSpan.FromMinutes(15);
    private const int MaxFailuresInWindow = 5;

    private sealed class AttemptState
    {
        public Queue<DateTimeOffset> Failures { get; } = new();
        public DateTimeOffset? BlockedUntilUtc { get; set; }
    }

    private readonly ConcurrentDictionary<string, AttemptState> _stateByIp = new();

    public bool IsBlocked(string remoteIp, out int retryAfterSeconds)
    {
        retryAfterSeconds = 0;
        var key = NormalizeKey(remoteIp);
        if (!_stateByIp.TryGetValue(key, out var state))
        {
            return false;
        }

        lock (state)
        {
            if (state.BlockedUntilUtc is null || state.BlockedUntilUtc <= DateTimeOffset.UtcNow)
            {
                state.BlockedUntilUtc = null;
                return false;
            }

            retryAfterSeconds = Math.Max(1, (int)Math.Ceiling((state.BlockedUntilUtc.Value - DateTimeOffset.UtcNow).TotalSeconds));
            return true;
        }
    }

    public void RegisterFailure(string remoteIp)
    {
        var key = NormalizeKey(remoteIp);
        var state = _stateByIp.GetOrAdd(key, _ => new AttemptState());

        lock (state)
        {
            var now = DateTimeOffset.UtcNow;
            var oldestAllowed = now - FailureWindow;
            while (state.Failures.Count > 0 && state.Failures.Peek() < oldestAllowed)
            {
                state.Failures.Dequeue();
            }

            state.Failures.Enqueue(now);
            if (state.Failures.Count >= MaxFailuresInWindow)
            {
                state.BlockedUntilUtc = now.Add(BlockDuration);
                state.Failures.Clear();
            }
        }
    }

    public void Reset(string remoteIp)
    {
        var key = NormalizeKey(remoteIp);
        _stateByIp.TryRemove(key, out _);
    }

    private static string NormalizeKey(string remoteIp)
    {
        return string.IsNullOrWhiteSpace(remoteIp) ? "unknown" : remoteIp.Trim();
    }
}
