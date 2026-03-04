namespace Platform.Core.Contracts.Auth;

public interface IAdminSecurityService
{
    bool ValidateCredentials(string userName, string password);
    Task<bool> RequestEmailCodeAsync(string email, string remoteIp, CancellationToken cancellationToken = default);
    ChangePasswordResult ChangePassword(string userName, string oldPassword, string newPassword, string emailCode);
}

public sealed record ChangePasswordResult(bool Success, string? ErrorCode = null);

