using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Platform.Modules.ProjectPosts.Contracts;

public sealed record UploadWithTemplateRequest(
    [property: Required] string TemplateType,
    IReadOnlyList<IFormFile> FrontendFiles,
    IReadOnlyList<IFormFile> BackendFiles);
