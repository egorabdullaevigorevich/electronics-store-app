using System.ComponentModel.DataAnnotations;

namespace ElectronicsStore.Api.Data;

public class Category
{
    public int Id { get; set; }
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    public List<Product> Products { get; set; } = [];
}

public class Product
{
    public int Id { get; set; }
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int WarrantyMonths { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? ImageFileName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }
}

public class User
{
    public int Id { get; set; }
    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
}
