using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Voyager.API.Migrations
{
    /// <inheritdoc />
    public partial class EnsureCampaignImageUrlColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('Campaigns', 'ImageUrl') IS NULL
BEGIN
    ALTER TABLE [Campaigns] ADD [ImageUrl] nvarchar(max) NULL;
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('Campaigns', 'ImageUrl') IS NOT NULL
BEGIN
    ALTER TABLE [Campaigns] DROP COLUMN [ImageUrl];
END
");
        }
    }
}

