using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ElectronicsStore.Api.Data;
using Microsoft.IdentityModel.Tokens;

namespace ElectronicsStore.Api.Services;

public class AuthService(IConfiguration configuration)
{
    public string GenerateToken(User user)
    {
        // Извлекаем наш приватный ключ из локального хранилища секретов
        var secretKey = configuration["Jwt:Key"] ?? throw new InvalidOperationException("Критическая ошибка: Ключ шифрования JWT не задан в User Secrets сервера!");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Помещаем ID и имя пользователя внутрь зашифрованного паспорта (Claims)
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username)
        };

        if (user.Username == "admin")
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(4), // Срок действия токена — 4 часа
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
