using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Voyager.API.Models;

namespace Voyager.API.Data
{
      public class VoyagerDbContext : IdentityDbContext<User, IdentityRole<int>, int>
      {
            public VoyagerDbContext(DbContextOptions<VoyagerDbContext> options) : base(options) { }

            public DbSet<Campaign> Campaigns { get; set; }
            public DbSet<CampaignLocation> CampaignLocations { get; set; }
            public DbSet<Lead> Leads { get; set; }
            public DbSet<CampaignLead> CampaignLeads { get; set; }
            public DbSet<EmailTemplate> EmailTemplates { get; set; }
            public DbSet<EmailLog> EmailLogs { get; set; }
            public DbSet<Analytics> Analytics { get; set; }
            public DbSet<WorkflowRule> WorkflowRules { get; set; }
            public DbSet<AuditLog> AuditLogs { get; set; }
            public DbSet<PasswordResetOtp> PasswordResetOtps { get; set; }
            public DbSet<Tenant> Tenants { get; set; }

            protected override void OnModelCreating(ModelBuilder builder)
            {
                  base.OnModelCreating(builder);

                  // User
                  builder.Entity<User>(entity =>
                  {
                        entity.ToTable("Users");
                        entity.HasOne(u => u.Tenant)
                        .WithMany(t => t.Users)
                        .HasForeignKey(u => u.TenantId)
                        .OnDelete(DeleteBehavior.Restrict);
                  });

                  // Campaign
                  builder.Entity<Campaign>(entity =>
                  {
                        entity.HasKey(e => e.CampaignID);
                        entity.Property(e => e.Budget).HasColumnType("decimal(10,2)");
                        entity.HasOne(e => e.Creator)
                        .WithMany(u => u.CreatedCampaigns)
                        .HasForeignKey(e => e.CreatedBy)
                        .OnDelete(DeleteBehavior.Restrict);
                        entity.HasOne(e => e.Location)
                        .WithMany(l => l.Campaigns)
                        .HasForeignKey(e => e.LocationID)
                        .OnDelete(DeleteBehavior.Restrict);
                        entity.HasOne(e => e.Archiver)
                        .WithMany()
                        .HasForeignKey(e => e.ArchivedBy)
                        .OnDelete(DeleteBehavior.Restrict);
                  });

                  // CampaignLocation
                  builder.Entity<CampaignLocation>(entity =>
                  {
                        entity.HasKey(e => e.LocationID);
                        entity.Property(e => e.Latitude).HasColumnType("decimal(10,8)");
                        entity.Property(e => e.Longitude).HasColumnType("decimal(11,8)");
                        entity.HasOne(e => e.Archiver)
                        .WithMany()
                        .HasForeignKey(e => e.ArchivedBy)
                        .OnDelete(DeleteBehavior.Restrict);
                  });

                  // Lead
                  builder.Entity<Lead>(entity =>
                  {
                        entity.HasKey(e => e.LeadID);
                        entity.HasOne(e => e.Tenant)
                        .WithMany(t => t.Leads)
                        .HasForeignKey(e => e.TenantId)
                        .OnDelete(DeleteBehavior.Restrict);
                        entity.HasOne(e => e.User)
                        .WithMany(u => u.Leads)
                        .HasForeignKey(e => e.UserID)
                        .OnDelete(DeleteBehavior.Restrict);
                        entity.HasOne(e => e.Campaign)
                        .WithMany()
                        .HasForeignKey(e => e.CampaignID)
                        .OnDelete(DeleteBehavior.Restrict);
                        entity.HasOne(e => e.Archiver)
                        .WithMany()
                        .HasForeignKey(e => e.ArchivedBy)
                        .OnDelete(DeleteBehavior.Restrict);
                  });

                  // CampaignLead
                  builder.Entity<CampaignLead>(entity =>
                  {
                        entity.HasKey(e => e.CampaignLeadID);
                        entity.HasOne(e => e.Campaign)
                        .WithMany(c => c.CampaignLeads)
                        .HasForeignKey(e => e.CampaignID)
                        .OnDelete(DeleteBehavior.Restrict);
                        entity.HasOne(e => e.Lead)
                        .WithMany(l => l.CampaignLeads)
                        .HasForeignKey(e => e.LeadID)
                        .OnDelete(DeleteBehavior.Restrict);
                  });

                  // EmailTemplate
                  builder.Entity<EmailTemplate>(entity =>
                  {
                        entity.HasKey(e => e.TemplateID);
                        entity.HasOne(e => e.Tenant)
                        .WithMany(t => t.EmailTemplates)
                        .HasForeignKey(e => e.TenantId)
                        .OnDelete(DeleteBehavior.Restrict);
                        entity.HasOne(e => e.Creator)
                        .WithMany()
                        .HasForeignKey(e => e.CreatedBy)
                        .OnDelete(DeleteBehavior.Restrict);
                  });

                  // EmailLog
                  builder.Entity<EmailLog>(entity =>
                  {
                        entity.HasKey(e => e.EmailLogID);
                        entity.HasOne(e => e.Campaign)
                        .WithMany(c => c.EmailLogs)
                        .HasForeignKey(e => e.CampaignID)
                        .OnDelete(DeleteBehavior.Restrict);
                        entity.HasOne(e => e.Lead)
                        .WithMany(l => l.EmailLogs)
                        .HasForeignKey(e => e.LeadID)
                        .OnDelete(DeleteBehavior.Restrict);
                        entity.HasOne(e => e.Template)
                        .WithMany(t => t.EmailLogs)
                        .HasForeignKey(e => e.TemplateID)
                        .OnDelete(DeleteBehavior.Restrict);
                        entity.HasOne(e => e.SentByUser)
                        .WithMany()
                        .HasForeignKey(e => e.SentBy)
                        .OnDelete(DeleteBehavior.Restrict);
                  });

                  // Analytics
                  builder.Entity<Analytics>(entity =>
                  {
                        entity.HasKey(e => e.AnalyticsID);
                        entity.Property(e => e.EngagementRate).HasColumnType("decimal(5,2)");
                        entity.Property(e => e.ConversionRate).HasColumnType("decimal(5,2)");
                        entity.Property(e => e.Revenue).HasColumnType("decimal(10,2)");
                        entity.Property(e => e.CostPerLead).HasColumnType("decimal(10,2)");
                        entity.Property(e => e.CalculatedROI).HasColumnType("decimal(10,2)");
                        entity.HasOne(e => e.Campaign)
                        .WithMany(c => c.Analytics)
                        .HasForeignKey(e => e.CampaignID)
                        .OnDelete(DeleteBehavior.Restrict);
                  });

                  // WorkflowRule
                  builder.Entity<WorkflowRule>(entity =>
                  {
                        entity.HasKey(e => e.RuleID);
                  });

                  // AuditLog
                  builder.Entity<AuditLog>(entity =>
                  {
                        entity.HasKey(e => e.Id);
                        entity.HasOne(e => e.User)
                        .WithMany()
                        .HasForeignKey(e => e.UserId)
                        .OnDelete(DeleteBehavior.Cascade);
                  });

                  builder.Entity<PasswordResetOtp>(entity =>
                  {
                        entity.HasKey(e => e.Id);
                        entity.Property(e => e.Email).HasMaxLength(256);
                        entity.Property(e => e.CodeHash).HasMaxLength(256);
                        entity.Property(e => e.RequestedIpAddress).HasMaxLength(128);
                        entity.HasOne(e => e.User)
                        .WithMany(u => u.PasswordResetOtps)
                        .HasForeignKey(e => e.UserId)
                        .OnDelete(DeleteBehavior.Cascade);
                  });

                  // Tenant
                  builder.Entity<Tenant>(entity =>
                  {
                        entity.HasKey(e => e.TenantId);
                        entity.HasMany(e => e.Campaigns)
            .WithOne(c => c.Tenant)
            .HasForeignKey(c => c.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
                  });
            }
      }
}
