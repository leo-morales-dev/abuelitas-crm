import { Component } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet], // 👈 se agrega RouterOutlet aquí
  template: `
    <div class="d-flex">
      <app-sidebar />
      <div class="flex-grow-1 p-4" style="min-height: 100vh;">
        <router-outlet></router-outlet> <!-- 👈 aquí se renderiza el contenido -->
      </div>
    </div>
  `
})
export class LayoutPage {}
