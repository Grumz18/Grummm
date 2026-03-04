using System.Text.Json;
using Npgsql;
using Platform.Modules.ProjectPosts.Application.Commands;
using Platform.Modules.ProjectPosts.Application.Repositories;
using Platform.Modules.ProjectPosts.Contracts;
using Platform.Modules.ProjectPosts.Domain.Entities;

namespace Platform.Modules.ProjectPosts.Infrastructure.Repositories;

public sealed class PostgresProjectPostRepository(string connectionString) : IProjectPostRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private const string LandingContentId = "main";

    public async Task<IReadOnlyList<ProjectPostDto>> ListAsync(CancellationToken cancellationToken)
    {
        const string sql = """
                           select id, title_en, title_ru, summary_en, summary_ru, description_en, description_ru,
                                  tags, hero_image_light, hero_image_dark, screenshots, video_url,
                                  template, frontend_path, backend_path
                           from project_posts
                           order by title_en;
                           """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);

        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var result = new List<ProjectPostDto>();
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(ReadDto(reader));
        }

        return result;
    }

    public async Task<ProjectPostDto?> GetByIdAsync(string id, CancellationToken cancellationToken)
    {
        const string sql = """
                           select id, title_en, title_ru, summary_en, summary_ru, description_en, description_ru,
                                  tags, hero_image_light, hero_image_dark, screenshots, video_url,
                                  template, frontend_path, backend_path
                           from project_posts
                           where id = @id;
                           """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("id", id);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return ReadDto(reader);
    }

    public async Task<ProjectPostDto> UpsertAsync(ProjectPostDto post, CancellationToken cancellationToken)
    {
        const string sql = """
                           insert into project_posts (
                               id, title_en, title_ru, summary_en, summary_ru, description_en, description_ru,
                               tags, hero_image_light, hero_image_dark, screenshots, video_url,
                               template, frontend_path, backend_path, created_at, updated_at
                           )
                           values (
                               @id, @title_en, @title_ru, @summary_en, @summary_ru, @description_en, @description_ru,
                               @tags, @hero_image_light, @hero_image_dark, @screenshots::jsonb, @video_url,
                               @template, @frontend_path, @backend_path, now(), now()
                           )
                           on conflict (id) do update set
                               title_en = excluded.title_en,
                               title_ru = excluded.title_ru,
                               summary_en = excluded.summary_en,
                               summary_ru = excluded.summary_ru,
                               description_en = excluded.description_en,
                               description_ru = excluded.description_ru,
                               tags = excluded.tags,
                               hero_image_light = excluded.hero_image_light,
                               hero_image_dark = excluded.hero_image_dark,
                               screenshots = excluded.screenshots,
                               video_url = excluded.video_url,
                               template = excluded.template,
                               frontend_path = excluded.frontend_path,
                               backend_path = excluded.backend_path,
                               updated_at = now();
                           """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);

        await using var command = new NpgsqlCommand(sql, connection);
        BindUpsertParameters(command, post);
        await command.ExecuteNonQueryAsync(cancellationToken);

        return post;
    }

    public async Task<ProjectPostDto?> UploadWithTemplateAsync(UploadWithTemplateCommand command, CancellationToken cancellationToken)
    {
        var existing = await GetByIdAsync(command.Id, cancellationToken);
        if (existing is null)
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

        var updated = existing with
        {
            Template = command.TemplateType,
            FrontendPath = ProjectTemplateStorage.GetFrontendPath(command.Id),
            BackendPath = ProjectTemplateStorage.GetBackendPath(command.Id, command.TemplateType)
        };

        await UpsertAsync(updated, cancellationToken);
        return updated;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken)
    {
        const string sql = "delete from project_posts where id = @id;";

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("id", id);
        var affected = await command.ExecuteNonQueryAsync(cancellationToken);
        return affected > 0;
    }

    public async Task<LandingContentDto> GetLandingContentAsync(CancellationToken cancellationToken)
    {
        const string sql = """
                           select hero_eyebrow_en, hero_eyebrow_ru,
                                  hero_title_en, hero_title_ru,
                                  hero_description_en, hero_description_ru,
                                  about_title_en, about_title_ru,
                                  about_text_en, about_text_ru,
                                  portfolio_title_en, portfolio_title_ru,
                                  portfolio_text_en, portfolio_text_ru,
                                  about_photo
                           from landing_content
                           where id = @id;
                           """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("id", LandingContentId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return ReadLandingContent(reader);
        }

        var seed = SeedLandingContent();
        await UpsertLandingContentAsync(seed, cancellationToken);
        return seed;
    }

    public async Task<LandingContentDto> UpsertLandingContentAsync(LandingContentDto content, CancellationToken cancellationToken)
    {
        const string sql = """
                           insert into landing_content (
                               id,
                               hero_eyebrow_en, hero_eyebrow_ru,
                               hero_title_en, hero_title_ru,
                               hero_description_en, hero_description_ru,
                               about_title_en, about_title_ru,
                               about_text_en, about_text_ru,
                               portfolio_title_en, portfolio_title_ru,
                               portfolio_text_en, portfolio_text_ru,
                               about_photo,
                               created_at, updated_at
                           )
                           values (
                               @id,
                               @hero_eyebrow_en, @hero_eyebrow_ru,
                               @hero_title_en, @hero_title_ru,
                               @hero_description_en, @hero_description_ru,
                               @about_title_en, @about_title_ru,
                               @about_text_en, @about_text_ru,
                               @portfolio_title_en, @portfolio_title_ru,
                               @portfolio_text_en, @portfolio_text_ru,
                               @about_photo,
                               now(), now()
                           )
                           on conflict (id) do update set
                               hero_eyebrow_en = excluded.hero_eyebrow_en,
                               hero_eyebrow_ru = excluded.hero_eyebrow_ru,
                               hero_title_en = excluded.hero_title_en,
                               hero_title_ru = excluded.hero_title_ru,
                               hero_description_en = excluded.hero_description_en,
                               hero_description_ru = excluded.hero_description_ru,
                               about_title_en = excluded.about_title_en,
                               about_title_ru = excluded.about_title_ru,
                               about_text_en = excluded.about_text_en,
                               about_text_ru = excluded.about_text_ru,
                               portfolio_title_en = excluded.portfolio_title_en,
                               portfolio_title_ru = excluded.portfolio_title_ru,
                               portfolio_text_en = excluded.portfolio_text_en,
                               portfolio_text_ru = excluded.portfolio_text_ru,
                               about_photo = excluded.about_photo,
                               updated_at = now();
                           """;

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);

        await using var command = new NpgsqlCommand(sql, connection);
        BindLandingParameters(command, content);
        await command.ExecuteNonQueryAsync(cancellationToken);
        return content;
    }

    private static void BindUpsertParameters(NpgsqlCommand command, ProjectPostDto post)
    {
        command.Parameters.AddWithValue("id", post.Id);
        command.Parameters.AddWithValue("title_en", post.Title.En);
        command.Parameters.AddWithValue("title_ru", post.Title.Ru);
        command.Parameters.AddWithValue("summary_en", post.Summary.En);
        command.Parameters.AddWithValue("summary_ru", post.Summary.Ru);
        command.Parameters.AddWithValue("description_en", post.Description.En);
        command.Parameters.AddWithValue("description_ru", post.Description.Ru);
        command.Parameters.AddWithValue("tags", post.Tags ?? Array.Empty<string>());
        command.Parameters.AddWithValue("hero_image_light", post.HeroImage.Light);
        command.Parameters.AddWithValue("hero_image_dark", post.HeroImage.Dark);
        command.Parameters.AddWithValue("screenshots", JsonSerializer.Serialize(post.Screenshots ?? Array.Empty<ThemedAssetDto>(), JsonOptions));
        command.Parameters.AddWithValue("video_url", (object?)post.VideoUrl ?? DBNull.Value);
        command.Parameters.AddWithValue("template", (short)post.Template);
        command.Parameters.AddWithValue("frontend_path", (object?)post.FrontendPath ?? DBNull.Value);
        command.Parameters.AddWithValue("backend_path", (object?)post.BackendPath ?? DBNull.Value);
    }

    private static ProjectPostDto ReadDto(NpgsqlDataReader reader)
    {
        var screenshotsJson = reader.GetString(reader.GetOrdinal("screenshots"));
        var screenshots = JsonSerializer.Deserialize<ThemedAssetDto[]>(screenshotsJson, JsonOptions) ?? [];

        return new ProjectPostDto(
            Id: reader.GetString(reader.GetOrdinal("id")),
            Title: new LocalizedTextDto(
                En: reader.GetString(reader.GetOrdinal("title_en")),
                Ru: reader.GetString(reader.GetOrdinal("title_ru"))),
            Summary: new LocalizedTextDto(
                En: reader.GetString(reader.GetOrdinal("summary_en")),
                Ru: reader.GetString(reader.GetOrdinal("summary_ru"))),
            Description: new LocalizedTextDto(
                En: reader.GetString(reader.GetOrdinal("description_en")),
                Ru: reader.GetString(reader.GetOrdinal("description_ru"))),
            Tags: (string[])reader["tags"],
            HeroImage: new ThemedAssetDto(
                Light: reader.GetString(reader.GetOrdinal("hero_image_light")),
                Dark: reader.GetString(reader.GetOrdinal("hero_image_dark"))),
            Screenshots: screenshots,
            VideoUrl: reader.IsDBNull(reader.GetOrdinal("video_url"))
                ? null
                : reader.GetString(reader.GetOrdinal("video_url")),
            Template: (TemplateType)reader.GetInt16(reader.GetOrdinal("template")),
            FrontendPath: reader.IsDBNull(reader.GetOrdinal("frontend_path"))
                ? null
                : reader.GetString(reader.GetOrdinal("frontend_path")),
            BackendPath: reader.IsDBNull(reader.GetOrdinal("backend_path"))
                ? null
                : reader.GetString(reader.GetOrdinal("backend_path")));
    }

    private static LandingContentDto ReadLandingContent(NpgsqlDataReader reader)
    {
        return new LandingContentDto(
            HeroEyebrow: new LocalizedTextDto(
                En: reader.GetString(reader.GetOrdinal("hero_eyebrow_en")),
                Ru: reader.GetString(reader.GetOrdinal("hero_eyebrow_ru"))),
            HeroTitle: new LocalizedTextDto(
                En: reader.GetString(reader.GetOrdinal("hero_title_en")),
                Ru: reader.GetString(reader.GetOrdinal("hero_title_ru"))),
            HeroDescription: new LocalizedTextDto(
                En: reader.GetString(reader.GetOrdinal("hero_description_en")),
                Ru: reader.GetString(reader.GetOrdinal("hero_description_ru"))),
            AboutTitle: new LocalizedTextDto(
                En: reader.GetString(reader.GetOrdinal("about_title_en")),
                Ru: reader.GetString(reader.GetOrdinal("about_title_ru"))),
            AboutText: new LocalizedTextDto(
                En: reader.GetString(reader.GetOrdinal("about_text_en")),
                Ru: reader.GetString(reader.GetOrdinal("about_text_ru"))),
            PortfolioTitle: new LocalizedTextDto(
                En: reader.GetString(reader.GetOrdinal("portfolio_title_en")),
                Ru: reader.GetString(reader.GetOrdinal("portfolio_title_ru"))),
            PortfolioText: new LocalizedTextDto(
                En: reader.GetString(reader.GetOrdinal("portfolio_text_en")),
                Ru: reader.GetString(reader.GetOrdinal("portfolio_text_ru"))),
            AboutPhoto: reader.IsDBNull(reader.GetOrdinal("about_photo"))
                ? null
                : reader.GetString(reader.GetOrdinal("about_photo")));
    }

    private static void BindLandingParameters(NpgsqlCommand command, LandingContentDto content)
    {
        command.Parameters.AddWithValue("id", LandingContentId);
        command.Parameters.AddWithValue("hero_eyebrow_en", content.HeroEyebrow.En);
        command.Parameters.AddWithValue("hero_eyebrow_ru", content.HeroEyebrow.Ru);
        command.Parameters.AddWithValue("hero_title_en", content.HeroTitle.En);
        command.Parameters.AddWithValue("hero_title_ru", content.HeroTitle.Ru);
        command.Parameters.AddWithValue("hero_description_en", content.HeroDescription.En);
        command.Parameters.AddWithValue("hero_description_ru", content.HeroDescription.Ru);
        command.Parameters.AddWithValue("about_title_en", content.AboutTitle.En);
        command.Parameters.AddWithValue("about_title_ru", content.AboutTitle.Ru);
        command.Parameters.AddWithValue("about_text_en", content.AboutText.En);
        command.Parameters.AddWithValue("about_text_ru", content.AboutText.Ru);
        command.Parameters.AddWithValue("portfolio_title_en", content.PortfolioTitle.En);
        command.Parameters.AddWithValue("portfolio_title_ru", content.PortfolioTitle.Ru);
        command.Parameters.AddWithValue("portfolio_text_en", content.PortfolioText.En);
        command.Parameters.AddWithValue("portfolio_text_ru", content.PortfolioText.Ru);
        command.Parameters.AddWithValue("about_photo", (object?)content.AboutPhoto ?? DBNull.Value);
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

    private static async Task EnsureSchemaAsync(NpgsqlConnection connection, CancellationToken cancellationToken)
    {
        const string sql = """
                           create table if not exists project_posts (
                               id text primary key,
                               title_en text not null,
                               title_ru text not null,
                               summary_en text not null,
                               summary_ru text not null,
                               description_en text not null,
                               description_ru text not null,
                               tags text[] not null default '{}',
                               hero_image_light text not null,
                               hero_image_dark text not null,
                               screenshots jsonb not null default '[]'::jsonb,
                               video_url text null,
                               template smallint not null default 0,
                               frontend_path text null,
                               backend_path text null,
                               created_at timestamptz not null default now(),
                               updated_at timestamptz not null default now()
                           );

                           create table if not exists landing_content (
                               id text primary key,
                               hero_eyebrow_en text not null,
                               hero_eyebrow_ru text not null,
                               hero_title_en text not null,
                               hero_title_ru text not null,
                               hero_description_en text not null,
                               hero_description_ru text not null,
                               about_title_en text not null,
                               about_title_ru text not null,
                               about_text_en text not null,
                               about_text_ru text not null,
                               portfolio_title_en text not null,
                               portfolio_title_ru text not null,
                               portfolio_text_en text not null,
                               portfolio_text_ru text not null,
                               about_photo text null,
                               created_at timestamptz not null default now(),
                               updated_at timestamptz not null default now()
                           );
                           """;

        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

}
