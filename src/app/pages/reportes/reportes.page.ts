import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../clientes/cliente.service';
import { PedidoService } from '../pedidos/pedido.service';
import { CatalogoService } from '../catalogos/catalogo.service';
import { Observable, firstValueFrom } from 'rxjs';
import { NgFor, AsyncPipe } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  private catalogoService = inject(CatalogoService);

  datos$!: Observable<any[]>;
  datosClientes: any[] = [];

  ranking: { nombre: string; tipoCliente: string; totalPedidos: number }[] = [];

  tipoClienteLabels: string[] = [];
  tipoClienteData: number[] = [];
  tipoClienteColors: string[] = [];

  chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  };

  async ngOnInit(): Promise<void> {
    const [clientes, pedidos, tiposCatalogo] = await Promise.all([
      firstValueFrom(this.clienteService.obtenerClientes()),
      firstValueFrom(this.pedidoService.obtenerPedidos()),
      firstValueFrom(this.catalogoService.getTiposCliente())
    ]);

    // Colores estándar del Dashboard
    const colorPorTipo: Record<string, string> = {
      'Premier': '#dd1a1e',
      'Tradicional': '#0065bc',
      'VIP': '#ffcc00',
      'No Aplica': '#6c757d'
    };

    // 1. Obtener tipos únicos REALES como en dashboard
    const tiposDeClientes = Array.from(new Set(clientes.map(c => c.tipoCliente || 'No Aplica')));
    const tiposFinales = [...new Set([...tiposCatalogo, ...tiposDeClientes])];

    this.datosClientes = clientes.map(c => {
      const pedidosCliente = pedidos.filter(p => p.clienteId === c.id);
      return {
        ...c,
        totalPedidos: pedidosCliente.length,
        ultimaCompra: pedidosCliente.at(-1)?.fechaHora,
        inactivo: this.estaInactivo(pedidosCliente.at(-1)?.fechaHora)
      };
    });

    this.datos$ = new Observable(observer => observer.next(this.datosClientes));

    this.ranking = clientes.map(c => {
      const pedidosCliente = pedidos.filter(p => p.clienteId === c.id);
      return {
        nombre: c.nombre,
        tipoCliente: c.tipoCliente || 'No Aplica',
        totalPedidos: pedidosCliente.length
      };
    }).sort((a, b) => b.totalPedidos - a.totalPedidos);

    // 2. Armar gráfico desde tiposFinales
    this.tipoClienteLabels = tiposFinales;
    this.tipoClienteData = tiposFinales.map(t =>
      clientes.filter(c => (c.tipoCliente || 'No Aplica') === t).length
    );
    this.tipoClienteColors = tiposFinales.map(t => colorPorTipo[t] || this.generarColorAleatorio());
  }

  estaInactivo(fecha: string | undefined): boolean {
    if (!fecha) return true;
    const hoy = new Date();
    const ultima = new Date(fecha);
    return hoy.getTime() - ultima.getTime() > (90 * 24 * 60 * 60 * 1000);
  }

  getMedalla(index: number): string {
    return ['🥇', '🥈', '🥉'][index] || '';
  }

  getTipoBadge(tipo: string): string {
    switch ((tipo || 'No Aplica').toLowerCase()) {
      case 'premier':
        return 'bg-danger text-white';
      case 'tradicional':
        return 'bg-primary text-white';
      case 'vip':
        return 'bg-warning text-dark';
      case 'no aplica':
      default:
        return 'bg-secondary text-white';
    }
  }

  exportarPDF() {
    const doc = new jsPDF();
    doc.text('Actividad de Clientes', 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [['Nombre', 'Total Pedidos', 'Última Compra', 'Estado']],
      body: this.datosClientes.map(c => [
        c.nombre,
        c.totalPedidos,
        c.ultimaCompra
          ? new Date(c.ultimaCompra).toLocaleDateString('es-MX', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          : 'N/A',
        c.inactivo ? 'Inactivo' : 'Activo'
      ]),
      theme: 'striped'
    });
    doc.save('actividad-clientes.pdf');
  }

  private generarColorAleatorio(): string {
    const r = Math.floor(Math.random() * 156) + 100;
    const g = Math.floor(Math.random() * 156) + 100;
    const b = Math.floor(Math.random() * 156) + 100;
    return `rgb(${r}, ${g}, ${b})`;
  }
}
