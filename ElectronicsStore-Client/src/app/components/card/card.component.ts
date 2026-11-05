import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListDto } from '../../models/product.interface';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
  private authService = inject(AuthService);

  // Современный синтаксис ввода данных через input() по ТЗ
  product = input.required<ProductListDto>();

  // События-уведомления для родительского компонента через output() по ТЗ
  edit = output<number>();
  delete = output<number>();
  upload = output<number>();

  isAdmin = this.authService.isAdmin;

  // Хелпер для формирования полного URL картинки товара
  getImageUrl(): string {
    const img = this.product().imageUrl;
    // ИСПРАВЛЕНО: Указан верный порт бэкенда 5250
    return img ? `http://localhost:5250${img}` : 'assets/no-photo.png';
  }
}
