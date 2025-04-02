import { Component, OnInit, inject } from '@angular/core';
import { CatalogoService } from '../catalogos/catalogo.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-catalogos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogos.page.html'
})
export class CatalogosPage implements OnInit {
  catalogoService = inject(CatalogoService);

  categorias = [
    { nombre: 'Tipos de Pizza', path: 'tiposPizza', usaPrecio: true },
    { nombre: 'Ingredientes', path: 'ingredientes' },
    { nombre: 'Especialidades', path: 'especialidades' },
    { nombre: 'Métodos de Pago', path: 'metodosPago' },
    { nombre: 'Tipos de Entrega', path: 'tiposEntrega' },
    { nombre: 'Tipos de Cliente', path: 'tiposCliente' }
  ];

  datos: { [key: string]: any[] } = {};
  nuevos: { [key: string]: any } = {};
  editando: { [path: string]: { [id: string]: boolean } } = {};

  ngOnInit(): void {
    for (let c of this.categorias) {
      this.catalogoService.obtenerLista(c.path).subscribe(lista => {
        this.datos[c.path] = lista;
        this.editando[c.path] = {};
      });
      this.nuevos[c.path] = { nombre: '', precio: null };
    }
  }

  agregar(path: string) {
    const nuevo = this.nuevos[path];
    if (nuevo?.nombre?.trim()) {
      this.catalogoService.agregarItem(path, nuevo);
      this.nuevos[path] = { nombre: '', precio: null };
    }
  }

  async eliminar(path: string, id: string) {
    if (confirm('¿Eliminar este ítem?')) {
      await this.catalogoService.eliminarItem(path, id);
    }
  }

  editar(path: string, id: string) {
    this.editando[path][id] = true;
  }

  async guardar(path: string, item: any) {
    await this.catalogoService.actualizarItem(path, item.id, item);
    this.editando[path][item.id] = false;
  }

  cancelar(path: string, id: string) {
    this.editando[path][id] = false;
  }
}
