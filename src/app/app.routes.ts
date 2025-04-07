import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { authGuard } from './core/auth.guard';
import { LayoutPage } from './pages/layout/layout.page';

export const appRoutes: Routes = [
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: '',
    component: LayoutPage,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./pages/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('./pages/clientes/clientes.routes').then(m => m.CLIENTES_ROUTES),
      },
      {
        path: 'pedidos',
        loadChildren: () =>
          import('./pages/pedidos/pedidos.routes').then(m => m.PEDIDOS_ROUTES),
      },
      {
        path: 'fidelizacion',
        loadChildren: () =>
          import('./pages/fidelizacion/fidelizacion.routes').then(m => m.FIDELIZACION_ROUTES),
      },
      {
        path: 'reportes',
        loadChildren: () =>
          import('./pages/reportes/reportes.routes').then(m => m.REPORTES_ROUTES),
      },
      {
        path: 'catalogos',
        loadChildren: () =>
          import('./pages/catalogos/catalogos.routes').then(m => m.CATALOGOS_ROUTES),
      },
      {
        path: '**', // 👈 Redirige cualquier ruta inválida dentro del layout
        redirectTo: '',
      }
    ]
  },
  {
    path: '**', // 👈 Ruta global inválida fuera del layout (por ejemplo /xxx sin login)
    redirectTo: 'login',
  }
];
