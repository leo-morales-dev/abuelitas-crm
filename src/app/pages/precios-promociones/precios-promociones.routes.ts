import { Routes } from '@angular/router';
import { PreciosPromocionesPage } from './precios-promociones.page';
import { authGuard } from '../../core/auth.guard';

export const PRECIOS_PROMOCIONES_ROUTES: Routes = [
  {
    path: '',
    component: PreciosPromocionesPage,
    canActivate: [authGuard]
  }
];
