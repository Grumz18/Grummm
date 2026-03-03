using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Platform.Core.Contracts.Audit;
using Platform.Modules.ProjectPosts.Application.Repositories;
using Platform.Modules.ProjectPosts.Application.Security;
using Platform.Modules.ProjectPosts.Contracts;

namespace Platform.Modules.ProjectPosts.Application.Commands;

public sealed class UploadWithTemplateCommandHandler(
    IProjectPostRepository repository,
    IProjectFileMalwareScanner malwareScanner,
    IAuditLogWriter auditLogWriter,
    ILogger<UploadWithTemplateCommandHandler> logger)
{
    public async Task<ProjectPostDto?> HandleAsync(UploadWithTemplateCommand command, CancellationToken cancellationToken = default)
    {
        UploadWithTemplateCommandValidator.Validate(command);
        var filesToScan = command.FrontendFiles.Concat(command.BackendFiles).ToArray();

        using (logger.BeginScope(new Dictionary<string, object>
               {
                   ["CorrelationId"] = command.CorrelationId,
                   ["ProjectId"] = command.Id,
                   ["TemplateType"] = command.TemplateType.ToString()
               }))
        {
            var scanResult = await malwareScanner.ScanAsync(filesToScan, cancellationToken);
            if (!scanResult.IsClean)
            {
                logger.LogWarning(
                    "Malware scan rejected upload. File: {FileName}, Signature: {Signature}",
                    scanResult.FileName,
                    scanResult.Signature);

                await auditLogWriter.WriteAdminActionAsync(new AdminActionAuditRecord(
                    OccurredAtUtc: DateTime.UtcNow,
                    UserId: command.PerformedByUserId,
                    UserName: command.PerformedByUserName,
                    Role: "Admin",
                    Action: $"MALWARE_REJECT project upload {command.Id}",
                    HttpMethod: "POST",
                    RequestPath: $"/api/app/projects/{command.Id}/upload-with-template",
                    QueryString: null,
                    ResponseStatusCode: StatusCodes.Status400BadRequest,
                    CorrelationId: command.CorrelationId,
                    IpAddress: null,
                    UserAgent: null), cancellationToken);

                throw new ValidationException(
                    $"Malware detected in upload file '{scanResult.FileName}'. Signature: {scanResult.Signature ?? "unknown"}");
            }
        }

        return await repository.UploadWithTemplateAsync(command, cancellationToken);
    }
}
