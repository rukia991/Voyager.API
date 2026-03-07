using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Voyager.API.Migrations
{
    /// <inheritdoc />
    public partial class AddArchivalAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ArchivedBy",
                table: "Leads",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedDate",
                table: "Leads",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ArchivedBy",
                table: "Campaigns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedDate",
                table: "Campaigns",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ArchivedBy",
                table: "CampaignLocations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedDate",
                table: "CampaignLocations",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Leads_ArchivedBy",
                table: "Leads",
                column: "ArchivedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_ArchivedBy",
                table: "Campaigns",
                column: "ArchivedBy");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignLocations_ArchivedBy",
                table: "CampaignLocations",
                column: "ArchivedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_CampaignLocations_Users_ArchivedBy",
                table: "CampaignLocations",
                column: "ArchivedBy",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Campaigns_Users_ArchivedBy",
                table: "Campaigns",
                column: "ArchivedBy",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Leads_Users_ArchivedBy",
                table: "Leads",
                column: "ArchivedBy",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CampaignLocations_Users_ArchivedBy",
                table: "CampaignLocations");

            migrationBuilder.DropForeignKey(
                name: "FK_Campaigns_Users_ArchivedBy",
                table: "Campaigns");

            migrationBuilder.DropForeignKey(
                name: "FK_Leads_Users_ArchivedBy",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Leads_ArchivedBy",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Campaigns_ArchivedBy",
                table: "Campaigns");

            migrationBuilder.DropIndex(
                name: "IX_CampaignLocations_ArchivedBy",
                table: "CampaignLocations");

            migrationBuilder.DropColumn(
                name: "ArchivedBy",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "ArchivedDate",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "ArchivedBy",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "ArchivedDate",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "ArchivedBy",
                table: "CampaignLocations");

            migrationBuilder.DropColumn(
                name: "ArchivedDate",
                table: "CampaignLocations");
        }
    }
}
