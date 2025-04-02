import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../clientes/cliente.service';
import { PedidoService } from '../pedidos/pedido.service';
import { combineLatest } from 'rxjs';
import { NgChartsModule } from 'ng2-charts';
import { ChartData } from 'chart.js';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css']
})
export class DashboardPage implements OnInit {
  private clienteService = inject(ClienteService);
  private pedidoService = inject(PedidoService);

  totalClientes = 0;
  totalPedidos = 0;
  clienteTop = '---';

  graficoData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#0d6efd', '#ffc107', '#dc3545'] }]
  };

  graficoPedidos: ChartData<'bar'> = { labels: [], datasets: [{ data: [], label: 'Pedidos' }] };

  ultimosPedidos: any[] = [];
  vista = 'Mes'; // Día, Semana, Mes

  pedidos: any[] = [];
  clientes: any[] = [];

  ngOnInit(): void {
    combineLatest([
      this.clienteService.obtenerClientes(),
      this.pedidoService.obtenerPedidos()
    ]).subscribe(([clientes, pedidos]) => {
      this.clientes = clientes;
      this.pedidos = pedidos;

      this.totalClientes = clientes.length;
      this.totalPedidos = pedidos.length;

      // Top cliente corregido
      const pedidosPorCliente: Record<string, number> = {};
      pedidos.forEach(p => {
        pedidosPorCliente[p.clienteId] = (pedidosPorCliente[p.clienteId] || 0) + 1;
      });

      if (Object.keys(pedidosPorCliente).length > 0) {
        const topClienteId = Object.entries(pedidosPorCliente)
          .filter(([id]) => clientes.some(c => c.id === id))
          .sort((a, b) => b[1] - a[1])[0][0];
        const topCliente = clientes.find(c => c.id === topClienteId);
        this.clienteTop = topCliente?.nombre || '---';
      } else {
        this.clienteTop = '---';
      }

      // Distribución de clientes
      // ...imports
      const tipos = ['Tradicional', 'Premier', 'VIP', 'No Aplica'];
      this.graficoData = {
        labels: tipos,
        datasets: [{
          data: tipos.map(t =>
            clientes.filter(c => (c.tipoCliente || 'No Aplica') === t).length
          ),
          backgroundColor: ['#0d6efd', '#ffc107', '#dc3545', '#6c757d']
        }]
      };


      // Últimos pedidos
      this.ultimosPedidos = pedidos
        .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())
        .slice(0, 5)
        .map(p => ({
          ...p,
          clienteNombre: clientes.find(c => c.id === p.clienteId)?.nombre || 'Desconocido'
        }));

      this.actualizarGraficoPedidos();
    });
  }

  actualizarGraficoPedidos() {
    const agrupado: Record<string, number> = {};
    const hoy = new Date().toLocaleDateString();

    this.pedidos.forEach(p => {
      const fecha = new Date(p.fechaHora);
      let clave = '';

      if (this.vista === 'Día') {
        const fechaStr = fecha.toLocaleDateString();
        if (fechaStr !== hoy) return;
        clave = fechaStr;
      } else if (this.vista === 'Semana') {
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(fecha.getDate() - fecha.getDay());
        clave = inicioSemana.toLocaleDateString();
      } else {
        clave = fecha.toLocaleString('default', { month: 'short' });
      }

      agrupado[clave] = (agrupado[clave] || 0) + 1;
    });

    const etiquetas = Object.keys(agrupado).sort((a, b) => {
      const fechaA = new Date(a);
      const fechaB = new Date(b);
      return fechaA.getTime() - fechaB.getTime(); // Orden cronológico
    });

    const datos = etiquetas.map(label => agrupado[label]);

    this.graficoPedidos = {
      labels: etiquetas,
      datasets: [{
        data: datos,
        label: `Pedidos por ${this.vista}`,
        backgroundColor: '#0d6efd'
      }]
    };
  }
}
