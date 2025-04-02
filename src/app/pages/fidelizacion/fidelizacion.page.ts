import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../clientes/cliente.service';
import { FidelizacionService } from './fidelizacion.service';
import { Observable } from 'rxjs';
import { AsyncPipe, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fidelizacion',
  standalone: true,
  imports: [CommonModule, NgFor, AsyncPipe, FormsModule],
  templateUrl: './fidelizacion.page.html'
})
export class FidelizacionPage implements OnInit {
  private clienteService = inject(ClienteService);
  private fidelizacionService = inject(FidelizacionService);

  clientes$!: Observable<any[]>;

  clienteSeleccionado: any = null;
  recompensaSeleccionada: string = '';

  ngOnInit(): void {
    this.clientes$ = this.clienteService.obtenerClientes();
  }

  aplicarRecompensa(cliente: any) {
    this.fidelizacionService.aplicarRecompensaSiAplica(cliente.id, cliente.puntos || 0);
  }

  estaInactivo(fecha: string): boolean {
    const hoy = new Date();
    const ultimaCompra = new Date(fecha);
    const diferencia = hoy.getTime() - ultimaCompra.getTime();
    return diferencia > (90 * 24 * 60 * 60 * 1000); // 90 días
  }

  abrirCanje(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.recompensaSeleccionada = '';
  }

  opcionesCanje(tipo: string): string[] {
    switch (tipo) {
      case 'VIP': return ['Pizza familiar + bebida', '2 pizzas personales'];
      case 'Premier': return ['Pizza mediana', '2 bebidas'];
      default: return ['Pizza personal', 'Bebida'];
    }
  }

  canjearRecompensa() {
    if (!this.recompensaSeleccionada || !this.clienteSeleccionado) return;

    this.fidelizacionService.aplicarRecompensaManual(
      this.clienteSeleccionado.id,
      this.recompensaSeleccionada
    ).then(() => {
      alert('Recompensa aplicada exitosamente');
      this.clienteSeleccionado = null;
    });
  }
}
