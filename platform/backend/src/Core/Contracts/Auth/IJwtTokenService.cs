using System.Security.Claims;

namespace Platform.Core.Contracts.Auth;

public interface IJwtTokenService
{
    string CreateAccessToken(AuthUser user, DateTime expiresAtUtc);
    bool TryValidateAccessToken(string token, out ClaimsPrincipal? principal);
    DateTime GetAccessTokenExpiryUtc();
}
