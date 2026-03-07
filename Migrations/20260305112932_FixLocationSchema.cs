using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Voyager.API.Migrations
{
    /// <inheritdoc />
    public partial class FixLocationSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Leads",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Campaigns",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "CampaignLocations",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "CampaignLocations");
        }
    }
}
