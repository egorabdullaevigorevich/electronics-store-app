import { Component, input, output, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ProductListDto } from '../../models/product.interface';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
  private platformId = inject(PLATFORM_ID); // Внедряем проверку платформы для SSR

  // Современный синтаксис ввода данных через input() по ТЗ
  product = input.required<ProductListDto>();

  // События-уведомления для родительского компонента через output() по ТЗ
  edit = output<number>();
  delete = output<number>();
  upload = output<number>();

  // Вычисляемое свойство (computed signal): проверяем, является ли пользователь автором товара
  isAuthor = computed(() => {
    // Безопасная проверка: если мы на сервере (SSR) — localStorage недоступен, возвращаем false
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const currentToken = localStorage.getItem('token');
    if (!currentToken) return false;
    
    const username = localStorage.getItem('username');
    // Проверяем, что вошел администратор и ID автора товара совпадает с admin (ID = 1)
    return username === 'admin' && this.product().userId === 1;
  });

  // Хелпер для формирования полного URL картинки товара
  getImageUrl(): string {
    const img = this.product().imageUrl;
    // ИСПРАВЛЕНО: Указан верный порт бэкенда 5250
    return img ? `http://localhost:5250${img}` : 'assets/no-photo.png';
  }
}
