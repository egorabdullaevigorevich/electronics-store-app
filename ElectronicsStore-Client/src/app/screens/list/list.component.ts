import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardComponent } from '../../components/card/card.component';
import { FilterComponent } from '../../components/filter/filter.component';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, FilterComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent {
  // Внедряем сервис как public, чтобы шаблон имел к нему прямой доступ
  public productService = inject(ProductService);
  private router = inject(Router);

  // Переход на защищенную форму редактирования товара (Выполнение ТЗ)
  onEditProduct(id: number): void {
    this.router.navigate([`/products/${id}/edit`]);
  }

  // Удаление товара автором записи (Код ответа бэкенда 204)
  onDeleteProduct(id: number): void {
    if (confirm('Вы действительно хотите удалить этот товар из каталога?')) {
      this.productService.delete(id).subscribe({
        next: () => {
          alert('Товар успешно удален.');
          // Триггерим обновление httpResource, сбрасывая страницу на первую
          this.productService.currentPage.set(1);
        },
        error: (err) => {
          console.error(err);
          alert('Ошибка при удалении. Проверьте права доступа (403).');
        }
      });
    }
  }

  // Загрузка фото товара автором (Лимит 5 МБ, сохранение на сервере как Guid)
  onUploadPhoto(id: number): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png, image/jpeg, image/webp';
    
    fileInput.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        
        this.productService.uploadImage(id, file).subscribe({
          next: (response) => {
            alert('Фотография товара успешно загружена!');
            // Перезагружаем текущую страницу для обновления кэша httpResource и отображения Guid-картинки
            this.productService.currentPage.set(this.productService.currentPage());
          },
          error: (err) => {
            console.error(err);
            const errorMessage = err.error?.message || 'Файл превышает 5 МБ или имеет некорректный формат.';
            alert('Ошибка загрузки: ' + errorMessage);
          }
        });
      }
    };
    
    fileInput.click(); // Открываем системное окно выбора файла
  }
}
