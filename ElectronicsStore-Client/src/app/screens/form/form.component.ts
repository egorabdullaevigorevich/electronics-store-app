import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Добавлен RouterModule для навигации
import { ProductService } from '../../services/product.service';
import { ProductCreateUpdateDto } from '../../models/product.interface';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Обязательно импортируем FormsModule и RouterModule
  templateUrl: './form.component.html',
  styleUrl: './form.component.css'
})
export class FormComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Состояние формы (Редактирование или Создание нового по ТЗ)
  public isEditMode = false;
  public isLoading = signal(false);
  private productId: number | null = null;

  // Модель данных формы для [(ngModel)] связи
  public model: ProductCreateUpdateDto = {
    name: '',
    price: 0,
    stock: 0,
    warrantyMonths: 12,
    description: '',
    categoryId: 1
  };

  // Реактивный сигнал для хранения объектов ошибок ProblemDetails (400) с сервера
  public serverErrors = signal<Record<string, string[]>>({});

  ngOnInit(): void {
    // Получаем ID из URL-маршрута: /products/:id/edit
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.productId = Number(idParam);
      this.isLoading.set(true);
      
      // Загружаем данные товара для предзаполнения формы редактирования
      this.productService.getById(this.productId).subscribe({
        next: (product) => {
          this.model = {
            name: product.name,
            price: product.price,
            stock: product.stock,
            warrantyMonths: product.warrantyMonths,
            description: product.description,
            categoryId: product.category.id
          };
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
          alert('Товар не найден или у вас нет прав на его редактирование.');
          this.router.navigate(['/404']);
        }
      });
    }
  }

  // Обработчик отправки формы (POST / PUT методы Minimal API)
  onSubmit(): void {
    // Очищаем предыдущие ошибки валидации перед отправкой запроса
    this.serverErrors.set({});

    const request$ = this.isEditMode && this.productId
      ? this.productService.update(this.productId, this.model)
      : this.productService.create(this.model);

    request$.subscribe({
      next: () => {
        this.productService.refresh();
        this.router.navigate(['/']); // Возвращаемся в каталог к адаптивной сетке
      },
      error: (err) => {
        console.error('Ошибка сохранения товара:', err);
        
        // Перехват и парсинг ProblemDetails (400) с объектом errors по Требованию №3
        if (err.status === 400 && err.error?.errors) {
          this.serverErrors.set(err.error.errors);
        } else if (err.status === 401) {
          alert('Ошибка 401: Сессия истекла, пожалуйста, войдите заново.');
          this.router.navigate(['/login']);
        } else if (err.status === 403) {
          alert('Ошибка 403: Доступ запрещен. Вы не являетесь автором этой записи!');
          this.router.navigate(['/']);
        } else {
          alert('Произошла непредвиденная ошибка на стороне бэкенд-сервера.');
        }
      }
    });
  }

  // Действие при клике на кнопку «Отмена»
  onCancel(): void {
    this.router.navigate(['/']);
  }
}
