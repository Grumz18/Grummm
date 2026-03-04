using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Platform.Core.Contracts.Auth;

namespace Platform.Infrastructure.Security;

public sealed class AdminSecurityService(
    IOptions<AdminSecurityOptions> adminOptionsAccessor,
    IOptions<EmailVerificationOptions> emailOptionsAccessor,
    ILogger<AdminSecurityService> logger) : IAdminSecurityService
{
    private readonly AdminSecurityOptions _adminOptions = adminOptionsAccessor.Value;
    private readonly EmailVerificationOptions _emailOptions = emailOptionsAccessor.Value;
    private readonly object _sync = new();
    private readonly byte[] _salt = RandomNumberGenerator.GetBytes(16);
    private string _passwordHash = string.Empty;
    private string? _emailCodeHash;
    private DateTimeOffset _emailCodeExpiresAtUtc;

    public bool ValidateCredentials(string userName, string password)
    {
        EnsureInitialized();
        if (!string.Equals(userName?.Trim(), _adminOptions.UserName, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return VerifyPassword(password, _passwordHash, _salt);
    }

    public async Task<RequestEmailCodeResult> RequestEmailCodeAsync(string email, string remoteIp, CancellationToken cancellationToken = default)
    {
        EnsureInitialized();
        if (!string.Equals(email?.Trim(), _adminOptions.Email, StringComparison.OrdinalIgnoreCase))
        {
            return new RequestEmailCodeResult(false, ErrorCode: "invalid_email");
        }

        var code = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        lock (_sync)
        {
            _emailCodeHash = ComputeSha256(code);
            _emailCodeExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(10);
        }

        var body = $"""
                    Код подтверждения для смены пароля Grummm: {code}
                    Код действует 10 минут.
                    IP запроса: {remoteIp}
                    """;

        if (!_emailOptions.Enabled)
        {
            logger.LogWarning(
                "EmailVerification disabled. Code for {Email} (for debug only): {Code}",
                email,
                code);
            return new RequestEmailCodeResult(true, DebugCode: code);
        }

        try
        {
            using var smtp = new SmtpClient(_emailOptions.SmtpHost, _emailOptions.SmtpPort)
            {
                EnableSsl = _emailOptions.UseSsl,
                Credentials = new NetworkCredential(_emailOptions.SmtpUser, _emailOptions.SmtpPassword)
            };
            using var message = new MailMessage(
                from: _emailOptions.FromEmail,
                to: email.Trim(),
                subject: "Grummm admin: код подтверждения",
                body: body);

            await smtp.SendMailAsync(message, cancellationToken);
            return new RequestEmailCodeResult(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email verification code.");
            if (ex is SmtpException smtpException &&
                smtpException.Message.Contains("Application password is REQUIRED", StringComparison.OrdinalIgnoreCase))
            {
                return new RequestEmailCodeResult(false, ErrorCode: "mailru_app_password_required");
            }

            return new RequestEmailCodeResult(false, ErrorCode: "email_send_failed");
        }
    }

    public ChangePasswordResult ChangePassword(string userName, string oldPassword, string newPassword, string emailCode)
    {
        EnsureInitialized();
        if (!string.Equals(userName?.Trim(), _adminOptions.UserName, StringComparison.OrdinalIgnoreCase))
        {
            return new ChangePasswordResult(false, "invalid_user");
        }

        if (!VerifyPassword(oldPassword, _passwordHash, _salt))
        {
            return new ChangePasswordResult(false, "invalid_old_password");
        }

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 8)
        {
            return new ChangePasswordResult(false, "weak_new_password");
        }

        if (!VerifyEmailCode(emailCode))
        {
            return new ChangePasswordResult(false, "invalid_email_code");
        }

        lock (_sync)
        {
            _passwordHash = HashPassword(newPassword, _salt);
            _emailCodeHash = null;
            _emailCodeExpiresAtUtc = DateTimeOffset.MinValue;
        }

        return new ChangePasswordResult(true);
    }

    private bool VerifyEmailCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return false;
        }

        lock (_sync)
        {
            if (_emailCodeHash is null || DateTimeOffset.UtcNow > _emailCodeExpiresAtUtc)
            {
                return false;
            }

            return string.Equals(_emailCodeHash, ComputeSha256(code.Trim()), StringComparison.Ordinal);
        }
    }

    private void EnsureInitialized()
    {
        if (!string.IsNullOrWhiteSpace(_passwordHash))
        {
            return;
        }

        lock (_sync)
        {
            if (string.IsNullOrWhiteSpace(_passwordHash))
            {
                _passwordHash = HashPassword(_adminOptions.Password, _salt);
            }
        }
    }

    private static string HashPassword(string password, byte[] salt)
    {
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password: password,
            salt: salt,
            iterations: 120_000,
            hashAlgorithm: HashAlgorithmName.SHA256,
            outputLength: 32);

        return Convert.ToBase64String(hash);
    }

    private static bool VerifyPassword(string password, string expectedHash, byte[] salt)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(expectedHash))
        {
            return false;
        }

        var computed = HashPassword(password, salt);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computed),
            Encoding.UTF8.GetBytes(expectedHash));
    }

    private static string ComputeSha256(string value)
    {
        var bytes = Encoding.UTF8.GetBytes(value);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash);
    }
}

