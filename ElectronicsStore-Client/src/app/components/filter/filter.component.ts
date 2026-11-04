import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Необходим для корректной работы [(ngModel)]
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css'
})
export class FilterComponent {
  private productService = inject(ProductService);

  // Статический справочник категорий из вашей базы данных SQLite
  public categories = [
    { id: 1, name: 'Смартфоны' },
    { id: 2, name: 'Ноутбуки' },
    { id: 3, name: 'Аксессуары' }
  ];

  // Геттер и сеттер для безопасного двустороннего маппинга категории
  get categoryValue(): string {
    return this.productService.selectedCategory()?.toString() || '';
  }
  set categoryValue(val: string) {
    // Если пользователь выбрал "Все категории" (пустая строка), пишем null, чтобы сбросить фильтр на сервере
    const parsedValue = val ? Number(val) : null;
    this.productService.selectedCategory.set(parsedValue);
    this.productService.currentPage.set(1); // Сброс пагинации на 1 страницу по ТЗ
  }

  // Геттер и сеттер для фильтра "Только в наличии"
  get inStockValue(): boolean {
    return this.productService.inStockOnly();
  }
  set inStockValue(val: boolean) {
    this.productService.inStockOnly.set(val);
    this.productService.currentPage.set(1);
  }

  // Геттер и сеттер для минимальной цены
  get minPriceValue(): number | null {
    return this.productService.minPrice();
  }
  set minPriceValue(val: number | null) {
    // Защита: если инпут очищен, пишем null
    this.productService.minPrice.set(val !== null && val !== undefined && val !== stringToNullCondition ? val : null);
    this.productService.currentPage.set(1);
  }

  // Геттер и сеттер для максимальной цены
  get maxPriceValue(): number | null {
    return this.productService.maxPrice();
  }
  set maxPriceValue(val: number | null) {
    this.productService.maxPrice.set(val !== null && val !== undefined ? val : null);
    this.productService.currentPage.set(1);
  }

  // Геттер и сеттер для выпадающего списка сортировки
  get sortValue(): string {
    return this.productService.sortBy();
  }
  set sortValue(val: string) {
    this.productService.sortBy.set(val);
    this.productService.currentPage.set(1);
  }
}

// Технический маркер для пустых полей
const stringToNullCondition = '' as any;
