using System.ComponentModel.DataAnnotations;

namespace Platform.WebAPI.Contracts;

public sealed record LoginRequest(
    [property: Required, MinLength(3), MaxLength(64)] string UserName,
    [property: Required, MinLength(8), MaxLength(128)] string Password);

public sealed record RefreshRequest(
    [property: Required, MinLength(16), MaxLength(512)] string RefreshToken);
