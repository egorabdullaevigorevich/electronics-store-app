using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ElectronicsStore.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductsSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$EC5ueMf7QtUI07ctjTcy4.PZBdQATtF6ssPu4V1eWqwO4a9wAfOxm");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$i5vchECtHHpWhVGirKc2XeF5k65F93tLShnSyZQbXfmclPB99N1f2");
        }
    }
}
