using System.ComponentModel.DataAnnotations;

namespace Platform.Modules.ProjectPosts.Contracts;

public sealed record LocalizedTextDto(
    [property: Required, MaxLength(200)] string En,
    [property: Required, MaxLength(200)] string Ru);

public sealed record ThemedAssetDto(
    [property: Required, MaxLength(2_000_000)] string Light,
    [property: Required, MaxLength(2_000_000)] string Dark);

public sealed record ProjectPostDto(
    [property: Required, MaxLength(80)] string Id,
    LocalizedTextDto Title,
    LocalizedTextDto Summary,
    LocalizedTextDto Description,
    string[] Tags,
    ThemedAssetDto HeroImage,
    ThemedAssetDto[] Screenshots,
    string? VideoUrl);

public sealed record UpsertProjectPostRequest(
    [property: Required, MaxLength(80)] string Id,
    LocalizedTextDto Title,
    LocalizedTextDto Summary,
    LocalizedTextDto Description,
    string[]? Tags,
    ThemedAssetDto HeroImage,
    ThemedAssetDto[]? Screenshots,
    [property: MaxLength(5_000_000)] string? VideoUrl);
