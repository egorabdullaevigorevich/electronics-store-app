import { inject, Injectable, signal, computed, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID); // Добавили для проверки среды (браузер/сервер)
  private readonly apiUrl = 'http://localhost:5250/api/auth';

  // Создаем сигнал изначально пустым (null), чтобы сервер не падал
  private tokenSignal = signal<string | null>(null);

  // Сигнал для имени пользователя (пригодится для отображения в UI автора)
  public currentUsername = signal<string | null>(null);
  public isAdmin = computed(() => this.currentUsername() === 'admin');

  // Публичный вычисляемый сигнал (computed) для проверки, вошел ли пользователь
  public isAuthenticated = computed(() => !!this.tokenSignal());

  constructor() {
    // На сервере этот блок пропустится, а в браузере — прочитает данные и обновит сигналы
    if (isPlatformBrowser(this.platformId)) {
      const savedToken = localStorage.getItem('token');
      const savedUsername = localStorage.getItem('username');
      
      if (savedToken) this.tokenSignal.set(savedToken);
      if (savedUsername) this.currentUsername.set(savedUsername);
    }
  }

  // Получить текущий токен
  public getToken(): string | null {
    return this.tokenSignal();
  }

  // Регистрация аккаунта
  public register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Вход в систему с сохранением данных в сигналы
  public login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          // Запись в localStorage делаем только в браузере
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('username', response.username);
          }
          this.tokenSignal.set(response.token); // Обновляем сигнал
          this.currentUsername.set(response.username);
        }
      })
    );
  }

  // Выход из системы
  public logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    }
    this.tokenSignal.set(null); // Сбрасываем сигнал
    this.currentUsername.set(null);
  }
}
