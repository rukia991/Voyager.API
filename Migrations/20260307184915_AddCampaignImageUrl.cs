using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Voyager.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCampaignImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Campaigns",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Campaigns");
        }
    }
}
