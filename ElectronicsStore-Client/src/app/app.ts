import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service'; // Импортируем

@Component({
  imports: [RouterOutlet, RouterModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('ElectronicsStore-Client');
  // Внедряем сервис, чтобы отслеживать состояние авторизации
  public authService = inject(AuthService);
}
