import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from './cliente.service';
import { Observable } from 'rxjs';
import { NgFor, AsyncPipe } from '@angular/common';
import { ClienteFormComponent } from './cliente-form.component';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CatalogoService } from '../catalogos/catalogo.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    AsyncPipe,
    ClienteFormComponent,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.css'] // ✔️ archivo de estilos
})
export class ClientesPage implements OnInit {
  private clienteService = inject(ClienteService);
  private catalogoService = inject(CatalogoService);

  clientes$!: Observable<any[]>;
  todosLosClientes: any[] = [];
  clienteEditando: any = null;

  filtro = new FormControl('');
  filtroSexo: string = '';
  filtroEntrega: string = '';

  preferenciasEntrega: string[] = [];

  ngOnInit(): void {
    // Cargar clientes
    this.clienteService.obtenerClientes().subscribe(data => {
      this.todosLosClientes = data;
      this.actualizarLista();
    });

    // Actualizar lista al escribir
    this.filtro.valueChanges.subscribe(() => this.actualizarLista());

    // Obtener catálogo de preferencias
    this.catalogoService.obtenerLista('tiposEntrega').subscribe(lista => {
      this.preferenciasEntrega = lista.map(e => e.nombre);
    });
  }

  actualizarLista() {
    const texto = (this.filtro.value || '').toLowerCase();

    this.clientes$ = new Observable(observer => {
      observer.next(
        this.todosLosClientes.filter(c =>
          (c.nombre?.toLowerCase().includes(texto) || c.direccion?.toLowerCase().includes(texto)) &&
          (!this.filtroSexo || c.sexo === this.filtroSexo) &&
          (!this.filtroEntrega || c.preferenciasEntrega === this.filtroEntrega)
        )
      );
    });
  }

  aplicarFiltros() {
    this.actualizarLista();
  }

  resetFiltros() {
    this.filtro.setValue('');
    this.filtroSexo = '';
    this.filtroEntrega = '';
    this.actualizarLista();
  }

  @ViewChild('registro') registroRef!: ElementRef;
  editarCliente(cliente: any) {
    this.clienteEditando = cliente;
  
    // Hacer scroll suave al formulario
    setTimeout(() => {
      this.registroRef?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }, 100); // pequeño delay para asegurar que se renderice
  }

  eliminarCliente(cliente: any) {
    const confirmado = confirm(`¿Eliminar al cliente ${cliente.nombre}?`);
    if (confirmado) {
      this.clienteService.eliminarCliente(cliente.id);
    }
  }
}
