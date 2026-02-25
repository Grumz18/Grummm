using Microsoft.EntityFrameworkCore;

namespace Platform.Infrastructure.Audit;

public sealed class AuditLogDbContext(DbContextOptions<AuditLogDbContext> options) : DbContext(options)
{
    public DbSet<AdminActionAuditEntity> AdminActionLogs => Set<AdminActionAuditEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<AdminActionAuditEntity>();
        entity.ToTable("admin_action_audit_logs", "audit");

        entity.HasKey(x => x.Id);
        entity.Property(x => x.Id).UseIdentityByDefaultColumn();
        entity.Property(x => x.OccurredAtUtc).IsRequired();
        entity.Property(x => x.UserId).HasMaxLength(128).IsRequired();
        entity.Property(x => x.UserName).HasMaxLength(256);
        entity.Property(x => x.Role).HasMaxLength(64).IsRequired();
        entity.Property(x => x.Action).HasMaxLength(256).IsRequired();
        entity.Property(x => x.HttpMethod).HasMaxLength(16).IsRequired();
        entity.Property(x => x.RequestPath).HasMaxLength(512).IsRequired();
        entity.Property(x => x.QueryString).HasMaxLength(1024);
        entity.Property(x => x.ResponseStatusCode).IsRequired();
        entity.Property(x => x.CorrelationId).HasMaxLength(128);
        entity.Property(x => x.IpAddress).HasMaxLength(128);
        entity.Property(x => x.UserAgent).HasMaxLength(1024);

        entity.HasIndex(x => x.OccurredAtUtc);
        entity.HasIndex(x => x.UserId);
    }
}
