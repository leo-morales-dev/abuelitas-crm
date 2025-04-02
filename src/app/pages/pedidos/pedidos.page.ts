import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from './pedido.service';
import { Observable } from 'rxjs';
import { NgFor, AsyncPipe } from '@angular/common';
import { PedidoFormComponent } from './pedido-form.component';
import { ClienteService } from '../clientes/cliente.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, NgFor, AsyncPipe, PedidoFormComponent],
  templateUrl: './pedidos.page.html'
})
export class PedidosPage implements OnInit {
  private pedidoService = inject(PedidoService);
  private clienteService = inject(ClienteService);

  pedidos$!: Observable<any[]>;
  clientes: any[] = [];

  ngOnInit(): void {
    this.pedidos$ = this.pedidoService.obtenerPedidos();
    this.clienteService.obtenerClientes().subscribe(data => this.clientes = data);
  }

  getNombreCliente(clienteId: string): string {
    return this.clientes.find(c => c.id === clienteId)?.nombre || 'Desconocido';
  }

  getTipoCliente(clienteId: string): string {
    return this.clientes.find(c => c.id === clienteId)?.tipoCliente || 'Tradicional';
  }
}
