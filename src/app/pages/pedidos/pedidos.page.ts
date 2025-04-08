import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from './pedido.service';
import { ClienteService } from '../clientes/cliente.service';
import { NgFor, DatePipe } from '@angular/common';
import { PedidoFormComponent } from './pedido-form.component';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, NgFor, PedidoFormComponent],
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.css']
})
export class PedidosPage implements OnInit {
  private pedidoService = inject(PedidoService);
  private clienteService = inject(ClienteService);

  pedidos: any[] = [];
  clientes: any[] = [];

  ngOnInit(): void {
    this.pedidoService.obtenerPedidos().subscribe(pedidos => {
      this.pedidos = pedidos.sort((a, b) =>
        new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
      );
    });

    this.clienteService.obtenerClientes().subscribe(data => {
      this.clientes = data;
    });
  }

  getNombreCliente(clienteId: string): string {
    return this.clientes.find(c => c.id === clienteId)?.nombre || 'Desconocido';
  }

  getTipoCliente(clienteId: string): string {
    return this.clientes.find(c => c.id === clienteId)?.tipoCliente || 'Tradicional';
  }

  async updatePedidoEstado(pedido: any) {
    const ahora = new Date().toISOString();
    const actualizacion = {
      ...pedido,
      estado: 'Finalizado',
      fechaCierre: ahora
    };

    await this.pedidoService.actualizarPedido(pedido.id, actualizacion);
    // reflejarlo visualmente sin recargar
    pedido.estado = 'Finalizado';
    pedido.fechaCierre = ahora;
  }

  async finalizarPedido(pedido: any) {
    const ahora = new Date().toISOString();
    await this.pedidoService.actualizarPedido(pedido.id, {
      estado: 'Finalizado',
      fechaCierre: ahora
    });
  
    // Actualiza la tabla
    const index = this.pedidos.findIndex(p => p.id === pedido.id);
    if (index !== -1) {
      this.pedidos[index].estado = 'Finalizado';
      this.pedidos[index].fechaCierre = ahora;
    }
  }
  
}
