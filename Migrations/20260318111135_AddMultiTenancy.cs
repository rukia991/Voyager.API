using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Voyager.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiTenancy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "Leads",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "EmailTemplates",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "Campaigns",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "CampaignLocations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "Analytics",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    TenantId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SubscriptionPlan = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenants", x => x.TenantId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId",
                table: "Users",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_TenantId",
                table: "Leads",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_TenantId",
                table: "EmailTemplates",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_TenantId",
                table: "Campaigns",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignLocations_TenantId",
                table: "CampaignLocations",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Analytics_TenantId",
                table: "Analytics",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_Analytics_Tenants_TenantId",
                table: "Analytics",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "TenantId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CampaignLocations_Tenants_TenantId",
                table: "CampaignLocations",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "TenantId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Campaigns_Tenants_TenantId",
                table: "Campaigns",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "TenantId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_EmailTemplates_Tenants_TenantId",
                table: "EmailTemplates",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "TenantId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Leads_Tenants_TenantId",
                table: "Leads",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "TenantId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Tenants_TenantId",
                table: "Users",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "TenantId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Analytics_Tenants_TenantId",
                table: "Analytics");

            migrationBuilder.DropForeignKey(
                name: "FK_CampaignLocations_Tenants_TenantId",
                table: "CampaignLocations");

            migrationBuilder.DropForeignKey(
                name: "FK_Campaigns_Tenants_TenantId",
                table: "Campaigns");

            migrationBuilder.DropForeignKey(
                name: "FK_EmailTemplates_Tenants_TenantId",
                table: "EmailTemplates");

            migrationBuilder.DropForeignKey(
                name: "FK_Leads_Tenants_TenantId",
                table: "Leads");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Tenants_TenantId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "Tenants");

            migrationBuilder.DropIndex(
                name: "IX_Users_TenantId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Leads_TenantId",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_EmailTemplates_TenantId",
                table: "EmailTemplates");

            migrationBuilder.DropIndex(
                name: "IX_Campaigns_TenantId",
                table: "Campaigns");

            migrationBuilder.DropIndex(
                name: "IX_CampaignLocations_TenantId",
                table: "CampaignLocations");

            migrationBuilder.DropIndex(
                name: "IX_Analytics_TenantId",
                table: "Analytics");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "EmailTemplates");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "CampaignLocations");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Analytics");
        }
    }
}
