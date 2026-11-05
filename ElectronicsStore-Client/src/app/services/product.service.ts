import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { httpResource } from '@angular/common/http'; // Инструмент Angular 22 по ТЗ №6
import { Observable } from 'rxjs';
import { PagedResponse, ProductListDto, ProductCreateUpdateDto } from '../models/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  // Базовый адрес бэкенда .NET 10 Minimal API
  private readonly apiUrl = 'http://localhost:5250/api/products';

  // Реактивные сигналы для фильтрации, пагинации и сортировки по требованиям ТЗ
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(10);
  public selectedCategory = signal<number | null>(null);
  public inStockOnly = signal<boolean>(false);
  public minPrice = signal<number | null>(null);
  public maxPrice = signal<number | null>(null);
  public sortBy = signal<string>('id');

  /**
   * ИСПРАВЛЕНО: Жесткое реактивное связывание параметров запроса.
   * Формирование URL в виде строки внутри стрелочной функции гарантирует, 
   * что httpResource выполнит новый HTTP-запрос при каждом изменении любого из сигналов.
   */
  private productsResource = httpResource<PagedResponse<ProductListDto>>(() => {
    const queryParams: string[] = [];

    // Принудительно считываем и мапим сигналы в Query String параметров
    queryParams.push(`page=${this.currentPage()}`);
    queryParams.push(`pageSize=${this.pageSize()}`);

    const cat = this.selectedCategory();
    if (cat !== null && cat !== undefined && cat !== 0) {
      queryParams.push(`categoryId=${cat}`);
    }

    if (this.inStockOnly()) {
      queryParams.push(`inStock=true`);
    }

    const minP = this.minPrice();
    if (minP !== null && minP !== undefined) {
      queryParams.push(`minPrice=${minP}`);
    }

    const maxP = this.maxPrice();
    if (maxP !== null && maxP !== undefined) {
      queryParams.push(`maxPrice=${maxP}`);
    }

    const sort = this.sortBy();
    if (sort) {
      queryParams.push(`sortBy=${sort}`);
    }

    // Собираем финальный URL (например, http://localhost:5250/api/products?page=1&pageSize=10&categoryId=3)
    const fullUrl = `${this.apiUrl}?${queryParams.join('&')}`;

    return {
      url: fullUrl
    };
  });

  // Экспонируем реактивные сигналы состояния ресурса для UI-шаблонов (Выполнение требования №6)
  public products = computed(() => this.productsResource.value() ?? null);
  public isLoading = computed(() => this.productsResource.isLoading());
  public error = computed(() => this.productsResource.error());

  public refresh(): void {
    this.productsResource.reload();
  }

  // Остальные стандартные методы для CRUD операций
  public getById(id: number): Observable<ProductListDto> {
    return this.http.get<ProductListDto>(`${this.apiUrl}/${id}`);
  }

  public create(product: ProductCreateUpdateDto): Observable<any> {
    return this.http.post(this.apiUrl, product);
  }

  public update(id: number, product: ProductCreateUpdateDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, product);
  }

  public delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  public uploadImage(id: number, file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/${id}/upload`, formData);
  }
}
