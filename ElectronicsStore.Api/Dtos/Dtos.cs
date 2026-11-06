namespace ElectronicsStore.Api.Dtos;

// ДТО категории для вложения внутрь товара
public record CategoryDto(int Id, string Name);

// Основной ДТО для отдачи товара клиенту (с полной информацией)
public record ProductListDto(
    int Id, 
    string Name, 
    decimal Price, 
    int Stock, 
    int WarrantyMonths, 
    string Description, 
    string? ImageUrl, 
    CategoryDto Category, 
    int UserId
);

// ДТО, принимаемый сервером при создании нового товара
public record ProductCreateDto(
    string Name, 
    decimal Price, 
    int Stock, 
    int WarrantyMonths, 
    string Description, 
    int CategoryId
);

// ДТО, принимаемый сервером при обновлении существующего товара
public record ProductUpdateDto(
    string Name, 
    decimal Price, 
    int Stock, 
    int WarrantyMonths, 
    string Description, 
    int CategoryId
);

// Шаблон обертки для реализации постраничного вывода (Pagination)
public record PagedResponse<T>(List<T> Items, int Page, int PageSize, int Total);

// для регистрации аккаунта
public record RegisterDto(string Username, string Password);

//  для процесса входа
public record LoginDto(string Username, string Password);

// Ответ сервера при успешном входе, содержащий JWT-токен
public record AuthResponseDto(string Token, string Username, int UserId);
