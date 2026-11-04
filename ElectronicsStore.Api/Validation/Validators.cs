using FluentValidation;
using ElectronicsStore.Api.Dtos;

namespace ElectronicsStore.Api.Validation;

// Правила проверки данных при СОЗДАНИИ нового товара
public class ProductCreateValidator : AbstractValidator<ProductCreateDto>
{
    public ProductCreateValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Название товара не может быть пустым.")
            .MaximumLength(150).WithMessage("Название не должно превышать 150 символов.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Цена товара должна быть строго больше нуля.");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("Остаток товара на складе не может быть отрицательным.");

        RuleFor(x => x.WarrantyMonths)
            .GreaterThanOrEqualTo(0).WithMessage("Гарантийный срок не может быть отрицательным числом.");

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Необходимо указать корректный ID категории из справочника.");
    }
}

// Правила проверки данных при ОБНОВЛЕНИИ товара
public class ProductUpdateValidator : AbstractValidator<ProductUpdateDto>
{
    public ProductUpdateValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Название товара обязательно для заполнения.")
            .MaximumLength(150).WithMessage("Название слишком длинное (макс. 150 символов).");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Цена должна быть положительным числом.");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("Остаток не может уходить в минус.");

        RuleFor(x => x.WarrantyMonths)
            .GreaterThanOrEqualTo(0).WithMessage("Срок гарантии заполнен некорректно.");

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Выбранная категория не существует.");
    }
}
