using Microsoft.EntityFrameworkCore;

namespace ElectronicsStore.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId);

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Смартфоны" },
            new Category { Id = 2, Name = "Ноутбуки" },
            new Category { Id = 3, Name = "Аксессуары" }
        );

        var testUserHash = BCrypt.Net.BCrypt.HashPassword("Test1234");
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Username = "admin", PasswordHash = testUserHash }
        );

        modelBuilder.Entity<Product>().HasData(
            new Product { Id = 1, Name = "iPhone 15 Pro", Price = 120000, Stock = 10, WarrantyMonths = 12, Description = "Флагман Apple", CategoryId = 1, UserId = 1, CreatedAt = new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Product { Id = 2, Name = "Samsung Galaxy S24", Price = 95000, Stock = 5, WarrantyMonths = 24, Description = "Флагман Samsung", CategoryId = 1, UserId = 1, CreatedAt = new DateTime(2026, 11, 2, 0, 0, 0, DateTimeKind.Utc) },
            new Product { Id = 3, Name = "MacBook Air M3", Price = 140000, Stock = 3, WarrantyMonths = 12, Description = "Легкий ноутбук", CategoryId = 2, UserId = 1, CreatedAt = new DateTime(2026, 11, 3, 0, 0, 0, DateTimeKind.Utc) },
            new Product { Id = 4, Name = "Asus ROG Zephyrus", Price = 210000, Stock = 0, WarrantyMonths = 24, Description = "Игровой ноутбук", CategoryId = 2, UserId = 1, CreatedAt = new DateTime(2026, 11, 4, 0, 0, 0, DateTimeKind.Utc) },
            new Product { Id = 5, Name = "AirPods Pro 2", Price = 25000, Stock = 25, WarrantyMonths = 6, Description = "Наушники", CategoryId = 3, UserId = 1, CreatedAt = new DateTime(2026, 11, 4, 12, 0, 0, DateTimeKind.Utc) }
        );

    }
}
