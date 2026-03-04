using System.Collections.Concurrent;
using Platform.Modules.ProjectPosts.Application.Commands;
using Platform.Modules.ProjectPosts.Application.Repositories;
using Platform.Modules.ProjectPosts.Contracts;
using Platform.Modules.ProjectPosts.Domain.Entities;

namespace Platform.Modules.ProjectPosts.Infrastructure.Repositories;

public sealed class InMemoryProjectPostRepository : IProjectPostRepository
{
    private readonly ConcurrentDictionary<string, ProjectPost> _storage = new(StringComparer.OrdinalIgnoreCase);
    private LandingContentDto _landingContent = SeedLandingContent();

    public InMemoryProjectPostRepository(string? contentRootPath = null)
    {
        foreach (var seed in SeedPosts())
        {
            _storage[seed.Id] = ProjectPostMappings.ToDomain(seed);
        }
    }

    public Task<IReadOnlyList<ProjectPostDto>> ListAsync(CancellationToken cancellationToken)
    {
        var list = _storage.Values
            .OrderBy(p => p.Title.En, StringComparer.OrdinalIgnoreCase)
            .Select(ProjectPostMappings.ToDto)
            .ToArray();

        return Task.FromResult<IReadOnlyList<ProjectPostDto>>(list);
    }

    public Task<ProjectPostDto?> GetByIdAsync(string id, CancellationToken cancellationToken)
    {
        _storage.TryGetValue(id, out var value);
        return Task.FromResult(value is null ? null : ProjectPostMappings.ToDto(value));
    }

    public Task<ProjectPostDto> UpsertAsync(ProjectPostDto post, CancellationToken cancellationToken)
    {
        _storage[post.Id] = ProjectPostMappings.ToDomain(post);
        return Task.FromResult(post);
    }

    public async Task<ProjectPostDto?> UploadWithTemplateAsync(UploadWithTemplateCommand command, CancellationToken cancellationToken)
    {
        if (!_storage.TryGetValue(command.Id, out var existing))
        {
            return null;
        }

        ProjectTemplateStorage.ResetProjectFolder(command.Id);
        await ProjectTemplateStorage.SaveTemplateFilesAsync(
            command.Id,
            command.FrontendFiles,
            command.BackendFiles,
            command.TemplateType,
            cancellationToken);

        var updated = ProjectPostMappings.ToDto(existing) with
        {
            Template = command.TemplateType,
            FrontendPath = ProjectTemplateStorage.GetFrontendPath(command.Id),
            BackendPath = ProjectTemplateStorage.GetBackendPath(command.Id, command.TemplateType)
        };

        _storage[command.Id] = ProjectPostMappings.ToDomain(updated);
        return updated;
    }

    public Task<bool> DeleteAsync(string id, CancellationToken cancellationToken)
    {
        var removed = _storage.TryRemove(id, out _);
        return Task.FromResult(removed);
    }

    public Task<LandingContentDto> GetLandingContentAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult(_landingContent);
    }

    public Task<LandingContentDto> UpsertLandingContentAsync(LandingContentDto content, CancellationToken cancellationToken)
    {
        _landingContent = content;
        return Task.FromResult(_landingContent);
    }

    private static IEnumerable<ProjectPostDto> SeedPosts()
    {
        yield return new ProjectPostDto(
            Id: "task-tracker",
            Title: new LocalizedTextDto("Task Tracker", "Трекер задач"),
            Summary: new LocalizedTextDto(
                "Owner-scoped task board with secure private routes.",
                "Доска задач с owner-логикой и защищёнными приватными маршрутами."),
            Description: new LocalizedTextDto(
                "Task tracker module with CQRS handlers, ownership checks and private API routes.",
                "Модуль трекера задач с CQRS, проверкой владельца и приватными API-маршрутами."),
            Tags: ["React", ".NET", "CQRS"],
            HeroImage: new ThemedAssetDto(
                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 340'><rect width='600' height='340' fill='%231795a8'/></svg>",
                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 340'><rect width='600' height='340' fill='%230e2f48'/></svg>"),
            Screenshots:
            [
                new ThemedAssetDto(
                    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 340'><rect width='600' height='340' fill='%2328a6b8'/></svg>",
                    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 340'><rect width='600' height='340' fill='%23163145'/></svg>")
            ],
            VideoUrl: null,
            Template: TemplateType.None,
            FrontendPath: null,
            BackendPath: null);
    }

    private static LandingContentDto SeedLandingContent()
    {
        return new LandingContentDto(
            HeroEyebrow: new LocalizedTextDto("GRUMMM PLATFORM", "GRUMMM PLATFORM"),
            HeroTitle: new LocalizedTextDto(
                "A platform where projects become live demonstrations.",
                "Платформа, где проекты превращаются в живые демонстрации."),
            HeroDescription: new LocalizedTextDto(
                "Grummm.ru is a personal showcase with a public portfolio and private admin area where I manage projects, templates, and content.",
                "Grummm.ru — это персональная витрина с публичным портфолио и приватной админ-зоной, где я управляю проектами, шаблонами и контентом."),
            AboutTitle: new LocalizedTextDto("About Me", "Обо мне"),
            AboutText: new LocalizedTextDto(
                "I build practical web products end-to-end: from idea and interface to backend logic and deployment. This page shows my latest work and architecture approach.",
                "Я создаю прикладные веб-проекты: от идеи и интерфейса до backend-логики и деплоя. На этой странице вы видите мои актуальные работы и подход к архитектуре."),
            PortfolioTitle: new LocalizedTextDto("Portfolio", "Портфолио"),
            PortfolioText: new LocalizedTextDto(
                "The portfolio includes projects with multiple templates: static, JavaScript, C#, and Python. Each one can be opened, explored, and reviewed in action.",
                "В портфолио — проекты с разными шаблонами: static, JavaScript, C#, Python. Каждый можно открыть, изучить и оценить в работе."),
            AboutPhoto: null);
    }

}
