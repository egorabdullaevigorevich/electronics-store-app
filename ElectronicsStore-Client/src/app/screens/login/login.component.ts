import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  public isRegisterMode = false; // Переключение между Входом и Регистрацией
  public credentials = { username: '', password: '' };
  public errorMessage = signal<string | null>(null);

  onSubmit(): void {
    this.errorMessage.set(null);
    const action$ = this.isRegisterMode 
      ? this.authService.register(this.credentials)
      : this.authService.login(this.credentials);

    action$.subscribe({
      next: () => {
        if (this.isRegisterMode) {
          alert('Регистрация успешна! Теперь вы можете войти.');
          this.isRegisterMode = false;
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => this.errorMessage.set(err.error?.message || 'Ошибка аутентификации.')
    });
  }
}
