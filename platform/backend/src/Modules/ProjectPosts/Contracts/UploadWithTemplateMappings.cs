using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using Platform.Modules.ProjectPosts.Application.Commands;
using Platform.Modules.ProjectPosts.Domain.Entities;

namespace Platform.Modules.ProjectPosts.Contracts;

public static class UploadWithTemplateMappings
{
    public static UploadWithTemplateCommand ToCommand(string id, UploadWithTemplateRequest request)
    {
        if (!Enum.TryParse<TemplateType>(request.TemplateType, ignoreCase: true, out var templateType))
        {
            throw new ValidationException("TemplateType value is invalid.");
        }

        var frontendFiles = request.FrontendFiles ?? Array.Empty<IFormFile>();
        var backendFiles = request.BackendFiles ?? Array.Empty<IFormFile>();

        return new UploadWithTemplateCommand(
            Id: id.Trim(),
            TemplateType: templateType,
            FrontendFiles: frontendFiles.ToArray(),
            BackendFiles: backendFiles.ToArray());
    }
}
