import { Routes } from '@angular/router';
import { ListComponent } from './screens/list/list.component';
import { FormComponent } from './screens/form/form.component';
import { LoginComponent } from './screens/login/login.component';
import { NotFoundComponent } from './screens/not-found/not-found.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: ListComponent },
  { path: 'login', component: LoginComponent },
  { path: 'products/create', component: FormComponent, canActivate: [authGuard, adminGuard] },
  { path: 'products/:id/edit', component: FormComponent, canActivate: [authGuard, adminGuard] },
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '404' } // Все левые ссылки кидают на 404 страницу по ТЗ
];
