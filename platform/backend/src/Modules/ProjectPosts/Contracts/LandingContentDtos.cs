using System.ComponentModel.DataAnnotations;

namespace Platform.Modules.ProjectPosts.Contracts;

public sealed record LandingContentDto(
    LocalizedTextDto HeroEyebrow,
    LocalizedTextDto HeroTitle,
    LocalizedTextDto HeroDescription,
    LocalizedTextDto AboutTitle,
    LocalizedTextDto AboutText,
    LocalizedTextDto PortfolioTitle,
    LocalizedTextDto PortfolioText,
    [property: MaxLength(5_000_000)] string? AboutPhoto);

public sealed record UpsertLandingContentRequest(
    LocalizedTextDto HeroEyebrow,
    LocalizedTextDto HeroTitle,
    LocalizedTextDto HeroDescription,
    LocalizedTextDto AboutTitle,
    LocalizedTextDto AboutText,
    LocalizedTextDto PortfolioTitle,
    LocalizedTextDto PortfolioText,
    [property: MaxLength(5_000_000)] string? AboutPhoto);
