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
  public currentUserId = signal<number | null>(null);
  public isAdmin = computed(() => this.currentUsername() === 'admin');

  // Публичный вычисляемый сигнал (computed) для проверки, вошел ли пользователь
  public isAuthenticated = computed(() => !!this.tokenSignal());

  constructor() {
    // На сервере этот блок пропустится, а в браузере — прочитает данные и обновит сигналы
    if (isPlatformBrowser(this.platformId)) {
      const savedToken = localStorage.getItem('token');
      const savedUsername = localStorage.getItem('username');
      const savedUserId = localStorage.getItem('userId');
      
      if (savedToken) {
        this.tokenSignal.set(savedToken);
        this.currentUserId.set(Number(savedUserId) || this.readUserId(savedToken));
      }
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
    return this.http.post<{ token: string; username: string; userId: number }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          // Запись в localStorage делаем только в браузере
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('username', response.username);
            localStorage.setItem('userId', String(response.userId));
          }
          this.tokenSignal.set(response.token); // Обновляем сигнал
          this.currentUsername.set(response.username);
          this.currentUserId.set(response.userId);
        }
      })
    );
  }

  // Выход из системы
  public logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
    }
    this.tokenSignal.set(null); // Сбрасываем сигнал
    this.currentUsername.set(null);
    this.currentUserId.set(null);
  }

  private readUserId(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const userId = Number(payload['nameid'] ?? payload['sub']);
      return Number.isInteger(userId) && userId > 0 ? userId : null;
    } catch {
      return null;
    }
  }
}
