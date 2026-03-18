using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Voyager.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingTenantIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "WorkflowRules",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "EmailLogs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "CampaignLeads",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "AuditLogs",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "WorkflowRules");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "EmailLogs");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "CampaignLeads");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "AuditLogs");
        }
    }
}
