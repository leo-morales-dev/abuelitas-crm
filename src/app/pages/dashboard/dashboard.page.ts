import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../clientes/cliente.service';
import { PedidoService } from '../pedidos/pedido.service';
import { CatalogoService } from '../catalogos/catalogo.service';
import { ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { NgFor, DatePipe } from '@angular/common'; // 🔄 Quitamos NgIf y AsyncPipe
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgChartsModule,
    NgFor,
    DatePipe,
    FormsModule
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css']
})
export class DashboardPage implements OnInit {
  private clienteService = inject(ClienteService);
  private pedidoService = inject(PedidoService);
  private catalogoService = inject(CatalogoService);

  totalClientes = 0;
  totalPedidos = 0;
  clienteTop: string = '-';
  vista: 'Día' | 'Semana' | 'Mes' = 'Día';

  fechaInicio: string = '';
  fechaFin: string = '';

  ultimosPedidos: any[] = [];
  todosPedidos: any[] = [];
  todosClientes: any[] = [];

  graficoData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ label: '', data: [] }]
  };

  graficoOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      y: {
        ticks: {
          stepSize: 1
        },
        beginAtZero: true
      }
    }
  };

  graficoPedidos: ChartData<'bar'> = {
    labels: [],
    datasets: [{ label: 'Pedidos por periodo', data: [] }]
  };

  async ngOnInit() {
    const [clientes, pedidos, tiposDesdeCatalogo] = await Promise.all([
      firstValueFrom(this.clienteService.obtenerClientes()),
      firstValueFrom(this.pedidoService.obtenerPedidos()),
      firstValueFrom(this.catalogoService.getTiposCliente())
    ]);

    this.todosClientes = clientes;
    this.todosPedidos = pedidos;

    this.totalClientes = clientes.length;
    this.totalPedidos = pedidos.length;

    const ranking = clientes.map(c => {
      const pedidosCliente = pedidos.filter(p => p.clienteId === c.id);
      return { nombre: c.nombre, total: pedidosCliente.length };
    }).sort((a, b) => b.total - a.total);

    this.clienteTop = ranking[0]?.nombre || '-';

    const tiposDeClientes = Array.from(new Set(clientes.map(c => c.tipoCliente || 'No Aplica')));
    const tiposFinales = [...new Set([...tiposDesdeCatalogo, ...tiposDeClientes])];

    const coloresBase = ['#dd1a1e', '#0065bc', '#ffcc00', '#6f42c1', '#17a2b8', '#fd7e14', '#20c997'];

    const backgroundColors = tiposFinales.map((_, i) =>
      i < coloresBase.length ? coloresBase[i] : this.generarColorAleatorio()
    );

    this.graficoData = {
      labels: tiposFinales,
      datasets: [{
        label: '',
        data: tiposFinales.map(t =>
          clientes.filter(c => (c.tipoCliente || 'No Aplica') === t).length
        ),
        backgroundColor: backgroundColors
      }]
    };

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

    const inicio = this.fechaInicio ? new Date(this.fechaInicio) : null;
    const fin = this.fechaFin ? new Date(this.fechaFin + 'T23:59:59') : null;

    const pedidosFiltrados = this.todosPedidos.filter(p => {
      const fecha = new Date(p.fechaHora);
      return (!inicio || fecha >= inicio) && (!fin || fecha <= fin);
    });

    for (const pedido of pedidosFiltrados) {
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

    let clavesOrdenadas: string[] = [];

    if (this.vista === 'Semana') {
      clavesOrdenadas = Object.keys(agrupados).sort((a, b) => {
        const numA = parseInt(a.replace('Sem ', ''), 10);
        const numB = parseInt(b.replace('Sem ', ''), 10);
        return numA - numB;
      });
    } else {
      clavesOrdenadas = Object.keys(agrupados).sort((a, b) => {
        const fechaA = new Date(a);
        const fechaB = new Date(b);
        return fechaA.getTime() - fechaB.getTime();
      });
    }

    this.graficoPedidos = {
      labels: clavesOrdenadas,
      datasets: [{
        label: 'Pedidos por ' + this.vista,
        data: clavesOrdenadas.map(k => agrupados[k]),
        backgroundColor: '#0065bc',
        borderRadius: 6,
        barThickness: 30
      }]
    };
  }

  vistaCambiada() {
    // Si el usuario solo cambia la vista sin elegir fechas, actualizamos automáticamente
    if (!this.fechaInicio && !this.fechaFin) {
      this.actualizarGraficoPedidos();
    }
  }  

  resetFiltros() {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.vista = 'Día';
    this.actualizarGraficoPedidos();
  }
  

  obtenerSemanaDelAno(fecha: Date): number {
    const unDia = 86400000;
    const inicioAno = new Date(fecha.getFullYear(), 0, 1);
    const dias = Math.floor((fecha.getTime() - inicioAno.getTime()) / unDia);
    return Math.ceil((dias + inicioAno.getDay() + 1) / 7);
  }

  private generarColorAleatorio(): string {
    const r = Math.floor(Math.random() * 156) + 100;
    const g = Math.floor(Math.random() * 156) + 100;
    const b = Math.floor(Math.random() * 156) + 100;
    return `rgb(${r}, ${g}, ${b})`;
  }
}
