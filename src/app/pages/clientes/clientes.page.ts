import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from './cliente.service';
import { Observable } from 'rxjs';
import { NgFor, AsyncPipe } from '@angular/common';
import { ClienteFormComponent } from './cliente-form.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, NgFor, AsyncPipe, ClienteFormComponent, ReactiveFormsModule],
  templateUrl: './clientes.page.html'
})
export class ClientesPage implements OnInit {
  private clienteService = inject(ClienteService);
  clientes$!: Observable<any[]>;
  todosLosClientes: any[] = [];
  clienteEditando: any = null;
  filtro = new FormControl('');

  ngOnInit(): void {
    this.clienteService.obtenerClientes().subscribe(data => {
      this.todosLosClientes = data;
      this.actualizarLista();
    });

    this.filtro.valueChanges.subscribe(() => this.actualizarLista());
  }

  actualizarLista() {
    const texto = (this.filtro.value || '').toLowerCase();
    this.clientes$ = new Observable(observer => {
      observer.next(
        this.todosLosClientes.filter(c =>
          c.nombre?.toLowerCase().includes(texto) ||
          c.direccion?.toLowerCase().includes(texto)
        )
      );
    });
  }

  editarCliente(cliente: any) {
    this.clienteEditando = cliente;
  }

  eliminarCliente(cliente: any) {
    const confirmado = confirm(`¿Eliminar al cliente ${cliente.nombre}?`);
    if (confirmado) {
      this.clienteService.eliminarCliente(cliente.id);
    }
  }
}
