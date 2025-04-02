import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../clientes/cliente.service';
import { PedidoService } from '../pedidos/pedido.service';
import { combineLatest, Observable } from 'rxjs';
import { NgFor, AsyncPipe } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, NgFor, AsyncPipe, NgChartsModule],
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.css']
})
export class ReportesPage implements OnInit {
  private clienteService = inject(ClienteService);
  private pedidoService = inject(PedidoService);

  datos$!: Observable<any[]>;
  ranking: { nombre: string; tipoCliente: string; totalPedidos: number }[] = [];

  tipoClienteLabels: string[] = [];
  tipoClienteData: number[] = [];
  tipoClienteColors: string[] = ['#007bff', '#ffc107', '#28a745']; // Azul, Dorado, Verde

  chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  };

  ngOnInit(): void {
    combineLatest([
      this.clienteService.obtenerClientes(),
      this.pedidoService.obtenerPedidos()
    ]).subscribe(([clientes, pedidos]) => {
      // Datos para tabla de actividad
      this.datos$ = new Observable(observer => {
        observer.next(clientes.map(c => {
          const pedidosCliente = pedidos.filter(p => p.clienteId === c.id);
          return {
            ...c,
            totalPedidos: pedidosCliente.length,
            ultimaCompra: pedidosCliente.at(-1)?.fechaHora,
            inactivo: this.estaInactivo(pedidosCliente.at(-1)?.fechaHora)
          };
        }));
      });

      // Ranking de clientes
      this.ranking = clientes.map(c => {
        const pedidosCliente = pedidos.filter(p => p.clienteId === c.id);
        return {
          nombre: c.nombre,
          tipoCliente: c.tipoCliente || 'No Aplica',
          totalPedidos: pedidosCliente.length
        };
      }).sort((a, b) => b.totalPedidos - a.totalPedidos);

      // Gráfico tipo de cliente
      const tipos = ['Tradicional', 'Premier', 'VIP', 'No Aplica'];
        this.tipoClienteLabels = tipos;
        this.tipoClienteData = tipos.map(t =>
          clientes.filter(c => (c.tipoCliente || 'No Aplica') === t).length
        );
    });
  }

  estaInactivo(fecha: string | undefined): boolean {
    if (!fecha) return true;
    const hoy = new Date();
    const ultima = new Date(fecha);
    return hoy.getTime() - ultima.getTime() > (90 * 24 * 60 * 60 * 1000); // 90 días
  }

  getMedalla(index: number): string {
    return ['🥇', '🥈', '🥉'][index] || '';
  }

  getTipoBadge(tipo: string): string {
    switch ((tipo || 'Tradicional').toLowerCase()) {
      case 'tradicional':
        return 'bg-primary text-white';
      case 'premier':
        return 'bg-warning text-dark';
      case 'vip':
        return 'bg-success text-white';
      default:
        return 'bg-secondary text-white';
    }
  }
}
