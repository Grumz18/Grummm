using System.Security.Claims;

namespace Platform.Core.Contracts.Security;

public static class OwnershipGuard
{
    public static bool IsOwnerOrAdmin(ClaimsPrincipal user, string ownerUserId)
    {
        if (user?.Identity?.IsAuthenticated is not true)
        {
            return false;
        }

        if (user.IsInRole("Admin"))
        {
            return true;
        }

        var callerUserId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return !string.IsNullOrWhiteSpace(callerUserId)
               && string.Equals(callerUserId, ownerUserId, StringComparison.Ordinal);
    }
}
