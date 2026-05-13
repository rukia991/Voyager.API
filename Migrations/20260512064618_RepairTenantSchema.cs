using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Voyager.API.Migrations
{
    /// <inheritdoc />
    public partial class RepairTenantSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[Tenants]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [Tenants] (
                        [TenantId] int NOT NULL IDENTITY,
                        [CompanyName] nvarchar(max) NOT NULL,
                        [SubscriptionPlan] nvarchar(max) NULL,
                        [IsActive] bit NOT NULL,
                        [CreatedDate] datetime2 NOT NULL,
                        CONSTRAINT [PK_Tenants] PRIMARY KEY ([TenantId])
                    );
                END

                IF NOT EXISTS (SELECT 1 FROM [Tenants])
                BEGIN
                    INSERT INTO [Tenants] ([CompanyName], [SubscriptionPlan], [IsActive], [CreatedDate])
                    VALUES (N'Voyager System Inc.', N'Default', 1, SYSUTCDATETIME());
                END

                DECLARE @DefaultTenantId int = (SELECT TOP (1) [TenantId] FROM [Tenants] ORDER BY [TenantId]);

                IF COL_LENGTH(N'[Campaigns]', N'TenantId') IS NULL
                BEGIN
                    ALTER TABLE [Campaigns] ADD [TenantId] int NULL;
                    UPDATE [Campaigns] SET [TenantId] = @DefaultTenantId WHERE [TenantId] IS NULL;
                    ALTER TABLE [Campaigns] ALTER COLUMN [TenantId] int NOT NULL;
                END
                ELSE
                BEGIN
                    UPDATE c
                    SET [TenantId] = @DefaultTenantId
                    FROM [Campaigns] c
                    WHERE [TenantId] IS NULL
                       OR NOT EXISTS (
                            SELECT 1
                            FROM [Tenants] t
                            WHERE t.[TenantId] = c.[TenantId]
                       );
                END

                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE [name] = N'IX_Campaigns_TenantId'
                      AND [object_id] = OBJECT_ID(N'[Campaigns]')
                )
                BEGIN
                    CREATE INDEX [IX_Campaigns_TenantId] ON [Campaigns] ([TenantId]);
                END

                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE [name] = N'FK_Campaigns_Tenants_TenantId'
                )
                BEGIN
                    ALTER TABLE [Campaigns]
                    ADD CONSTRAINT [FK_Campaigns_Tenants_TenantId]
                    FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([TenantId]) ON DELETE NO ACTION;
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE [name] = N'FK_Campaigns_Tenants_TenantId'
                )
                BEGIN
                    ALTER TABLE [Campaigns] DROP CONSTRAINT [FK_Campaigns_Tenants_TenantId];
                END

                IF EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE [name] = N'IX_Campaigns_TenantId'
                      AND [object_id] = OBJECT_ID(N'[Campaigns]')
                )
                BEGIN
                    DROP INDEX [IX_Campaigns_TenantId] ON [Campaigns];
                END

                IF COL_LENGTH(N'[Campaigns]', N'TenantId') IS NOT NULL
                BEGIN
                    ALTER TABLE [Campaigns] DROP COLUMN [TenantId];
                END

                IF OBJECT_ID(N'[Tenants]', N'U') IS NOT NULL
                BEGIN
                    DROP TABLE [Tenants];
                END
                """);
        }
    }
}
