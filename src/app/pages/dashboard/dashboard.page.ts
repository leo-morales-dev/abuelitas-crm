import { Component, OnInit, inject, Signal, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../clientes/cliente.service';
import { PedidoService } from '../pedidos/pedido.service';
import { CatalogoService } from '../catalogos/catalogo.service';
import { ChartConfiguration, ChartData } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { NgFor, AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgChartsModule,
    NgFor,
    NgIf,
    AsyncPipe,
    DatePipe,
    FormsModule
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css']
})

// Fragmento relevante del DashboardPage con correcciones
export class DashboardPage implements OnInit {
  private clienteService = inject(ClienteService);
  private pedidoService = inject(PedidoService);
  private catalogoService = inject(CatalogoService);

  totalClientes = 0;
  totalPedidos = 0;
  clienteTop: string = '-';
  vista: 'Día' | 'Semana' | 'Mes' = 'Mes';

  ultimosPedidos: any[] = [];
  todosPedidos: any[] = [];
  todosClientes: any[] = [];

  graficoData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ label: 'Clientes', data: [] }]
  };

  graficoPedidos: ChartData<'bar'> = {
    labels: [],
    datasets: [{ label: 'Pedidos por periodo', data: [] }]
  };

  async ngOnInit() {
    const [clientes, pedidos, tipos] = await Promise.all([
      firstValueFrom(this.clienteService.obtenerClientes()),
      firstValueFrom(this.pedidoService.obtenerPedidos()),
      firstValueFrom(this.catalogoService.getTiposCliente())
    ]);

    this.todosClientes = clientes;
    this.todosPedidos = pedidos;

    this.totalClientes = clientes.length;
    this.totalPedidos = pedidos.length;

    // Cliente TOP
    const ranking = clientes.map(c => {
      const pedidosCliente = pedidos.filter(p => p.clienteId === c.id);
      return { nombre: c.nombre, total: pedidosCliente.length };
    }).sort((a, b) => b.total - a.total);

    this.clienteTop = ranking[0]?.nombre || '-';

    // Distribución por tipo
    const todosTipos = [...tipos, 'No Aplica'];
    this.graficoData = {
      labels: todosTipos,
      datasets: [{
        label: 'Clientes por tipo',
        data: todosTipos.map(t =>
          clientes.filter(c => (c.tipoCliente || 'No Aplica') === t).length
        ),
        backgroundColor: ['#007bff', '#ffc107', '#28a745', '#6c757d', '#6610f2']
      }]
    };

    // Ultimos pedidos con nombres de cliente
    this.ultimosPedidos = pedidos
      .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())
      .slice(0, 5)
      .map(p => ({
        ...p,
        clienteNombre: clientes.find(c => c.id === p.clienteId)?.nombre || '(Sin nombre)'
      }));

    this.actualizarGraficoPedidos();
  }

  actualizarGraficoPedidos() {
    const agrupados: Record<string, number> = {};

    for (const pedido of this.todosPedidos) {
      const fecha = new Date(pedido.fechaHora);
      let clave = '';

      switch (this.vista) {
        case 'Día':
          clave = fecha.toLocaleDateString();
          break;
        case 'Semana':
          const semana = this.obtenerSemanaDelAno(fecha);
          clave = `Sem ${semana}`;
          break;
        case 'Mes':
        default:
          clave = fecha.toLocaleString('default', { month: 'short' });
      }

      agrupados[clave] = (agrupados[clave] || 0) + 1;
    }

    this.graficoPedidos = {
      labels: Object.keys(agrupados),
      datasets: [{
        label: 'Pedidos por ' + this.vista,
        data: Object.values(agrupados),
        backgroundColor: '#007bff'
      }]
    };
  }

  obtenerSemanaDelAno(fecha: Date): number {
    const unDia = 86400000;
    const inicioAno = new Date(fecha.getFullYear(), 0, 1);
    const dias = Math.floor((fecha.getTime() - inicioAno.getTime()) / unDia);
    return Math.ceil((dias + inicioAno.getDay() + 1) / 7);
  }
}

