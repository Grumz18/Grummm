using Microsoft.Extensions.Options;

namespace Platform.Infrastructure.Security;

public sealed class JwtOptionsValidator : IValidateOptions<JwtOptions>
{
    public ValidateOptionsResult Validate(string? name, JwtOptions options)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(options.Issuer))
        {
            errors.Add("Jwt:Issuer is required.");
        }

        if (string.IsNullOrWhiteSpace(options.Audience))
        {
            errors.Add("Jwt:Audience is required.");
        }

        if (string.IsNullOrWhiteSpace(options.SigningKey) || options.SigningKey.Length < 32)
        {
            errors.Add("Jwt:SigningKey must be at least 32 characters.");
        }

        if (options.AccessTokenLifetimeMinutes is < 1 or > 120)
        {
            errors.Add("Jwt:AccessTokenLifetimeMinutes must be between 1 and 120.");
        }

        if (options.RefreshTokenLifetimeDays is < 1 or > 30)
        {
            errors.Add("Jwt:RefreshTokenLifetimeDays must be between 1 and 30.");
        }

        if (options.ClockSkewSeconds is < 0 or > 300)
        {
            errors.Add("Jwt:ClockSkewSeconds must be between 0 and 300.");
        }

        return errors.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(errors);
    }
}
