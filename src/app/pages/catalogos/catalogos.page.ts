import { Component, OnInit, inject } from '@angular/core';
import { CatalogoService } from '../catalogos/catalogo.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Promocion } from '../../models/promocion.model';

@Component({
  selector: 'app-catalogos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogos.page.html',
  styleUrls: ['./catalogos.page.css'],
})
export class CatalogosPage implements OnInit {
  catalogoService = inject(CatalogoService);

  categorias = [
    { nombre: 'Tipos de Pizza', path: 'tiposPizza', usaPrecio: true },
    { nombre: 'Ingredientes', path: 'ingredientes' },
    { nombre: 'Especialidades', path: 'especialidades' },
    { nombre: 'Métodos de Pago', path: 'metodosPago' },
    { nombre: 'Tipos de Entrega', path: 'tiposEntrega' },
    { nombre: 'Tipos de Membresía', path: 'tiposCliente' }
  ];

  datos: { [key: string]: any[] } = {};
  tiposEntrega: string[] = [];

  nuevos: { [key: string]: any } = {};
  editando: { [path: string]: { [id: string]: boolean } } = {};

  promociones: Promocion[] = [];
  nuevaPromocion: Promocion = {
    nombre: '',
    precio: undefined,
    fechaInicio: '',
    fechaFin: '',
    diasValidos: [],
    tipoEntrega: '',
    condiciones: {
      minimoPizzas: undefined,
      tipoPizzaAplicable: ''
    }
  };

  diasSemana: string[] = [
    'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'
  ];

  ngOnInit(): void {
    for (let c of this.categorias) {
      this.catalogoService.obtenerLista(c.path).subscribe(lista => {
        this.datos[c.path] = lista;
        this.editando[c.path] = {};
      });
      this.nuevos[c.path] = { nombre: '', precio: undefined };
    }

    this.catalogoService.obtenerLista('tiposPizza').subscribe(lista => {
      this.datos['tiposPizza'] = lista;
    });

    this.catalogoService.obtenerLista('tiposEntrega').subscribe(lista => {
      this.tiposEntrega = lista.map(t => t.nombre);
    });

    this.catalogoService.obtenerPromociones().subscribe(p => {
      this.promociones = p;
    });
  }

  agregar(path: string) {
    const item = this.nuevos[path];
    if (!item.nombre?.trim()) return;

    const nuevoItem: any = {
      nombre: item.nombre
    };

    // Solo agrega el precio si está definido y es válido
    if (typeof item.precio === 'number' && !isNaN(item.precio)) {
      nuevoItem.precio = item.precio;
    }

    this.catalogoService.agregarItem(path, nuevoItem).then(() => {
      this.nuevos[path] = { nombre: '', precio: undefined };
    });
  }

  soloNumeros(event: KeyboardEvent) {
    const charCode = event.key;
    if (!/^\d$/.test(charCode)) {
      event.preventDefault();
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

  toggleDia(dia: string) {
    const index = this.nuevaPromocion.diasValidos.indexOf(dia);
    if (index >= 0) {
      this.nuevaPromocion.diasValidos.splice(index, 1);
    } else {
      this.nuevaPromocion.diasValidos.push(dia);
    }
  }

  async agregarPromocion() {
    const p = { ...this.nuevaPromocion };
    p.fechaInicio = new Date(p.fechaInicio).toISOString();
    p.fechaFin = new Date(p.fechaFin).toISOString();
    await this.catalogoService.agregarPromocion(p);

    this.nuevaPromocion = {
      nombre: '',
      precio: undefined,
      fechaInicio: '',
      fechaFin: '',
      diasValidos: [],
      tipoEntrega: '',
      condiciones: {
        minimoPizzas: undefined,
        tipoPizzaAplicable: ''
      }
    };
  }

  async eliminarPromocion(id?: string) {
    if (!id) return;
    if (confirm('¿Eliminar esta promoción?')) {
      await this.catalogoService.eliminarPromocion(id);
    }
  }
}
