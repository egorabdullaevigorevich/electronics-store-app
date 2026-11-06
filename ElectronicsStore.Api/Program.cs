using System.Security.Claims;
using System.Text;
using ElectronicsStore.Api.Data;
using ElectronicsStore.Api.Dtos;
using ElectronicsStore.Api.Services;
using ElectronicsStore.Api.Validation;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Globalization;

CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture;
CultureInfo.DefaultThreadCurrentUICulture = CultureInfo.InvariantCulture;
var builder = WebApplication.CreateBuilder(args);

// =================================================================================
// ПОДКЛЮЧЕНИЕ СЛУЖБ (БАЗА ДАННЫХ, БЕЗОПАСНОСТЬ, ВАЛИДАЦИЯ, CORS, OPENAPI)
// =================================================================================

// 1. Инициализация БД SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite("Data Source=electronics_store.db");
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// 2. Настройка безопасности и проверки JWT-токенов (из user-secrets)
var jwtKey = builder.Configuration["Jwt:Key"] ?? "FallbackSecretKeyForSafetyDevModeOnly123!!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            RoleClaimType = ClaimTypes.Role,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "StoreApi",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "StoreClient",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// 3. Настройка CORS, чтобы Angular-клиент мог делать запросы к API
builder.Services.AddCors(o => o.AddPolicy("AllowAngular", b => b.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// 4. Регистрация кастомной службы токенов и валидаторов FluentValidation
builder.Services.AddScoped<AuthService>();
builder.Services.AddValidatorsFromAssemblyContaining<ProductCreateValidator>();

// 5. Встроенная поддержка OpenAPI согласно новым стандартам .NET 10
builder.Services.AddOpenApi();

var app = builder.Build();

// =================================================================================
// НАСТРОЙКА МИДЛВАРЕ (MIDDLEWARE ROUTING)
// =================================================================================

app.UseCors("AllowAngular");
app.UseStaticFiles(); // Разрешаем доступ к картинкам товаров в wwwroot/uploads

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    // Красивый интерактивный интерфейс документации Scalar вместо старого Swagger по адресу /scalar
    app.MapScalarApiReference();
}

app.UseAuthentication();
app.UseAuthorization();

// Помощник для безопасного получения ID пользователя из токена
int? GetCurrentUserId(ClaimsPrincipal principal)
{
    var claim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    return int.TryParse(claim, out var userId) ? userId : null;
}

// Создаем базовую группу адресов по ТЗ
var api = app.MapGroup("/api/products");

// =================================================================================
// ЭНДПОИНТ 1: GET СПИСОК (Доступен всем. Исправлен маппинг параметров из Angular)
// =================================================================================
api.MapGet("/", async (
    AppDbContext db, 
    [FromQuery] int? categoryId, 
    [FromQuery] bool? inStock, 
    [FromQuery] decimal? minPrice, 
    [FromQuery] decimal? maxPrice, 
    [FromQuery] string? sortBy, 
    [FromQuery] int page = 1, 
    [FromQuery] int pageSize = 10) =>
{
    var query = db.Products.Include(p => p.Category).AsQueryable();

    if (categoryId.HasValue) query = query.Where(p => p.CategoryId == categoryId.Value);
    if (inStock.HasValue && inStock.Value) query = query.Where(p => p.Stock > 0);
    if (minPrice.HasValue) query = query.Where(p => p.Price >= minPrice.Value);
    if (maxPrice.HasValue) query = query.Where(p => p.Price <= maxPrice.Value);

    query = sortBy switch
    {
        "price_asc" => query.OrderBy(p => p.Price),
        "price_desc" => query.OrderByDescending(p => p.Price),
        "newest" => query.OrderByDescending(p => p.CreatedAt),
        _ => query.OrderBy(p => p.Id)
    };

    var total = await query.CountAsync();
    var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

    var dtos = items.Select(p => new ProductListDto(
        p.Id, p.Name, p.Price, p.Stock, p.WarrantyMonths, p.Description,
        p.ImageFileName != null ? $"/uploads/{p.ImageFileName}" : null,
        new CategoryDto(p.Category!.Id, p.Category.Name), p.UserId
    )).ToList();

    return Results.Ok(new PagedResponse<ProductListDto>(dtos, page, pageSize, total));
});

// =================================================================================
// ЭНДПОИНТ 2: GET ПО ID (Доступен владельцу товара)
// =================================================================================
api.MapGet("/{id:int}", async (int id, AppDbContext db, ClaimsPrincipal user) =>
{
    var currentUserId = GetCurrentUserId(user);
    if (currentUserId == null) return Results.Unauthorized();

    var p = await db.Products.Include(p => p.Category).FirstOrDefaultAsync(x => x.Id == id);
    if (p == null) return Results.NotFound();
    if (p.UserId != currentUserId.Value) return Results.Forbid();

    var dto = new ProductListDto(
        p.Id, p.Name, p.Price, p.Stock, p.WarrantyMonths, p.Description,
        p.ImageFileName != null ? $"/uploads/{p.ImageFileName}" : null,
        new CategoryDto(p.Category!.Id, p.Category.Name), p.UserId
    );
    return Results.Ok(dto);
}).RequireAuthorization();

// =================================================================================
// ЭНДПОИНТ 3: POST СОЗДАНИЕ (Только для авторизованных, код 201)
// =================================================================================
api.MapPost("/", async (
    ProductCreateDto dto, 
    AppDbContext db, 
    ClaimsPrincipal user, 
    IValidator<ProductCreateDto> validator) =>
{
    var currentUserId = GetCurrentUserId(user);
    if (currentUserId == null) return Results.Unauthorized();

    var validationResult = await validator.ValidateAsync(dto);
    if (!validationResult.IsValid) return Results.ValidationProblem(validationResult.ToDictionary());

    var product = new Product
    {
        Name = dto.Name,
        Price = dto.Price,
        Stock = dto.Stock,
        WarrantyMonths = dto.WarrantyMonths,
        Description = dto.Description,
        CategoryId = dto.CategoryId,
        UserId = currentUserId.Value,
        CreatedAt = DateTime.UtcNow
    };

    db.Products.Add(product);
    await db.SaveChangesAsync();

    return Results.Created($"/api/products/{product.Id}", product);
}).RequireAuthorization();

// =================================================================================
// ЭНДПОИНТ 4: PUT РЕДАКТИРОВАНИЕ (Только автор записи + контроль изменения цены)
// =================================================================================
api.MapPut("/{id:int}", async (
    int id, 
    ProductUpdateDto dto, 
    AppDbContext db, 
    ClaimsPrincipal user, 
    IValidator<ProductUpdateDto> validator) =>
{
    var currentUserId = GetCurrentUserId(user);
    if (currentUserId == null) return Results.Unauthorized();

    var product = await db.Products.FindAsync(id);
    if (product == null) return Results.NotFound();
    if (product.UserId != currentUserId.Value) return Results.Forbid();

    var validationResult = await validator.ValidateAsync(dto);
    if (!validationResult.IsValid) return Results.ValidationProblem(validationResult.ToDictionary());

    decimal oldPrice = product.Price;
    decimal newPrice = dto.Price;
    if (newPrice > oldPrice * 2 || newPrice < oldPrice / 2)
    {
        var errors = new Dictionary<string, string[]> {
            { "Price", ["Бизнес-правило: цену товара нельзя изменить более чем в 2 раза за одно редактирование!"] }
        };
        return Results.ValidationProblem(errors);
    }

    product.Name = dto.Name;
    product.Price = dto.Price;
    product.Stock = dto.Stock;
    product.WarrantyMonths = dto.WarrantyMonths;
    product.CategoryId = dto.CategoryId;
    product.Description = dto.Description;

    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// =================================================================================
// ЭНДПОИНТ 5: DELETE УДАЛЕНИЕ (Только автор записи, код 204)
// =================================================================================
api.MapDelete("/{id:int}", async (int id, AppDbContext db, ClaimsPrincipal user) =>
{
    var currentUserId = GetCurrentUserId(user);
    if (currentUserId == null) return Results.Unauthorized();

    var product = await db.Products.FindAsync(id);
    if (product == null) return Results.NotFound();
    if (product.UserId != currentUserId.Value) return Results.Forbid();

    db.Products.Remove(product);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// =================================================================================
// ДОПОЛНИТЕЛЬНО: ЗАГРУЗКА ИЗОБРАЖЕНИЯ (Только автор, лимит до 5 МБ, имя - Guid)
// =================================================================================
app.MapPost("/api/products/{id:int}/upload", async (int id, HttpContext httpContext, AppDbContext db, ClaimsPrincipal user) =>
{
    var currentUserId = GetCurrentUserId(user);
    if (currentUserId == null) return Results.Unauthorized();

    var product = await db.Products.FindAsync(id);
    if (product == null) return Results.NotFound();
    if (product.UserId != currentUserId.Value) return Results.Forbid();
    var form = await httpContext.Request.ReadFormAsync();
    var file = form.Files.GetFile("file");
    if (file == null || file.Length == 0) return Results.BadRequest("Файл не передан.");
    if (file.Length > 5 * 1024 * 1024) return Results.BadRequest("Размер файла превышает лимит 5 МБ.");

    var ext = Path.GetExtension(file.FileName).ToLower();
    if (!new[] { ".jpg", ".jpeg", ".png", ".webp" }.Contains(ext)) return Results.BadRequest("Разрешены только форматы jpg, png, webp.");

    var uniqueFileName = $"{Guid.NewGuid()}{ext}";
    var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
    if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);
    
    using (var stream = new FileStream(Path.Combine(uploadPath, uniqueFileName), FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }
    
    product.ImageFileName = uniqueFileName;
    await db.SaveChangesAsync();
    return Results.Ok(new { ImageUrl = $"/uploads/{uniqueFileName}" });
}).RequireAuthorization();

// =================================================================================
// УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (РЕГИСТРАЦИЯ И ВХОД)
// =================================================================================
app.MapPost("/api/auth/register", async (RegisterDto dto, AppDbContext db) =>
{
    if (string.Equals(dto.Username, "admin", StringComparison.OrdinalIgnoreCase))
        return Results.BadRequest(new { message = "Имя admin зарезервировано." });

    if (await db.Users.AnyAsync(u => u.Username == dto.Username))
        return Results.BadRequest(new { message = "Данное имя пользователя уже занято." });
        
    db.Users.Add(new User { Username = dto.Username, PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password) });
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Регистрация успешна." });
});

app.MapPost("/api/auth/login", async (LoginDto dto, AppDbContext db, AuthService authService) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
    if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        return Results.BadRequest(new { message = "Неверный логин или пароль." });
        
    return Results.Ok(new AuthResponseDto(authService.GenerateToken(user), user.Username, user.Id));
});

app.Run();
