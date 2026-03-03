using Microsoft.AspNetCore.Http;
using Platform.Modules.ProjectPosts.Domain.Entities;

namespace Platform.Modules.ProjectPosts.Application.Commands;

public sealed record UploadWithTemplateCommand(
    string Id,
    TemplateType TemplateType,
    IReadOnlyList<IFormFile> FrontendFiles,
    IReadOnlyList<IFormFile> BackendFiles);
