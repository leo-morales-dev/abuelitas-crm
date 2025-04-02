import { Component, OnInit, inject } from '@angular/core';
import {
  CurrencyPipe,
  NgIf,
  NgFor,
  AsyncPipe
} from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  ReactiveFormsModule
} from '@angular/forms';
import { PedidoService } from '../pedidos/pedido.service';
import { ClienteService } from '../clientes/cliente.service';
import { CatalogoService } from '../catalogos/catalogo.service';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-pedido-form',
  templateUrl: './pedido-form.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, AsyncPipe, CurrencyPipe]
})
export class PedidoFormComponent implements OnInit {
  form!: FormGroup;
  pedidoService = inject(PedidoService);
  clienteService = inject(ClienteService);
  catalogoService = inject(CatalogoService);
  clientes$ = this.clienteService.obtenerClientes();

  tiposPizza: string[] = [];
  ingredientesDisponibles: string[] = [];
  especialidadesDisponibles: string[] = [];
  metodosPago: string[] = [];
  tiposEntrega: string[] = [];
  preciosCatalogo: Record<string, number> = {};
  tipoClienteActual: string = 'Tradicional';

  nombrePromocionAplicada = '';
  fb = inject(FormBuilder);

  ngOnInit(): void {
    this.form = this.fb.group({
      clienteId: ['', Validators.required],
      fechaHora: [this.getFechaActual(), Validators.required],
      pizzas: this.fb.array([this.crearPizzaGroup()]),
      metodoPago: ['', Validators.required],
      tipoEntrega: ['', Validators.required],
      precioFinal: [0],
      nombrePromocionAplicada: [''],
      estado: ['En progreso', Validators.required],
      fechaCierre: ['']
    });

    this.form.get('estado')?.valueChanges.subscribe(estado => {
      this.form.get('fechaCierre')?.setValue(
        estado === 'Finalizado' ? this.getFechaActual() : ''
      );
    });

    this.catalogoService.obtenerLista('tiposPizza').subscribe(lista => {
      this.tiposPizza = lista.map(e => e.nombre);
      this.preciosCatalogo = Object.fromEntries(lista.map(e => [e.nombre, e.precio]));
      this.recalcularPrecio();
    });

    this.catalogoService.obtenerLista('ingredientes').subscribe(lista => {
      this.ingredientesDisponibles = lista.map(e => e.nombre);
    });

    this.catalogoService.obtenerLista('especialidades').subscribe(lista => {
      this.especialidadesDisponibles = lista.map(e => e.nombre);
    });

    this.catalogoService.obtenerLista('metodosPago').subscribe(lista => {
      this.metodosPago = lista.map(e => e.nombre);
    });

    this.catalogoService.obtenerLista('tiposEntrega').subscribe(lista => {
      this.tiposEntrega = lista.map(e => e.nombre);
    });

    this.form.get('clienteId')?.valueChanges.subscribe(clienteId => {
      this.clienteService.obtenerClientes().subscribe(clientes => {
        const cliente = clientes.find(c => c.id === clienteId);
        this.tipoClienteActual = cliente?.tipoCliente || 'Tradicional';
        this.recalcularPrecio();
      });
    });

    this.pizzasArray.valueChanges.subscribe(() => this.recalcularPrecio());
  }

  get pizzasArray(): FormArray {
    return this.form.get('pizzas') as FormArray;
  }

  crearPizzaGroup(): FormGroup {
    return this.fb.group({
      tipo: ['', Validators.required],
      ingredientes: [[], Validators.required],
      especialidad: ['']
    });
  }

  agregarPizza() {
    this.pizzasArray.push(this.crearPizzaGroup());
  }

  eliminarPizza(i: number) {
    this.pizzasArray.removeAt(i);
    this.recalcularPrecio();
  }

  getFechaActual(): string {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  recalcularPrecio() {
    if (!this.preciosCatalogo || !this.pizzasArray) return;

    let total = 0;
    const pizzas = this.pizzasArray.getRawValue();
    for (const p of pizzas) {
      const precio = this.preciosCatalogo[p.tipo] || 0;
      total += precio;
    }

    if (this.tipoClienteActual === 'Premier') {
      total *= 0.95;
    } else if (this.tipoClienteActual === 'VIP') {
      total *= 0.90;
    }

    total = parseFloat(total.toFixed(2));
    this.form.get('precioFinal')?.setValue(total, { emitEvent: false });

    // Promociones por monto total
    if (total >= 725) {
      this.nombrePromocionAplicada = 'Combo Empresarial';
    } else if (total >= 485) {
      this.nombrePromocionAplicada = 'Combo Fiesta';
    } else if (total >= 370) {
      this.nombrePromocionAplicada = 'Combo Familiar';
    } else if (total >= 200) {
      this.nombrePromocionAplicada = 'Promo Abuelita';
    } else {
      this.nombrePromocionAplicada = '';
    }
  }

  async guardarPedido() {
    const clienteId = this.form.get('clienteId')?.value;
    if (!clienteId || this.pizzasArray.length === 0) return;

    const pedido: Pedido = this.form.getRawValue();
    pedido.nombrePromocionAplicada = this.nombrePromocionAplicada;
    pedido.precioFinal = this.form.get('precioFinal')?.value;

    await this.pedidoService.agregarPedido(pedido);
    await this.clienteService.agregarPuntos(clienteId, this.calcularPuntos(pedido.precioFinal, this.nombrePromocionAplicada, pedido.fechaHora));

    this.form.reset();
    this.pizzasArray.clear();
    this.pizzasArray.push(this.crearPizzaGroup());
    this.form.patchValue({ fechaHora: this.getFechaActual(), estado: 'En progreso' });
    this.nombrePromocionAplicada = '';
  }

  calcularPuntos(monto: number, promo: string, fecha: string): number {
    let puntos = Math.floor(monto / 100) * 20;
    if (promo.includes('Combo')) puntos += Math.floor(puntos * 0.1);
    const dia = new Date(fecha).getDay();
    if (dia === 1 || dia === 2) puntos *= 2;
    return puntos;
  }

  agregarTipoPizza() {
    const nuevo = prompt('Escribe el nuevo tipo de pizza:');
    if (nuevo && !this.tiposPizza.includes(nuevo)) {
      this.catalogoService.agregarItem('tiposPizza', { nombre: nuevo });
    }
  }

  agregarIngrediente() {
    const nuevo = prompt('Escribe el nuevo ingrediente:');
    if (nuevo && !this.ingredientesDisponibles.includes(nuevo)) {
      this.catalogoService.agregarItem('ingredientes', { nombre: nuevo });
    }
  }

  agregarEspecialidad() {
    const nuevo = prompt('Escribe la nueva especialidad:');
    if (nuevo && !this.especialidadesDisponibles.includes(nuevo)) {
      this.catalogoService.agregarItem('especialidades', { nombre: nuevo });
    }
  }

  agregarMetodoPago() {
    const nuevo = prompt('Escribe el nuevo método de pago:');
    if (nuevo && !this.metodosPago.includes(nuevo)) {
      this.catalogoService.agregarItem('metodosPago', { nombre: nuevo });
    }
  }

  agregarTipoEntrega() {
    const nuevo = prompt('Escribe el nuevo tipo de entrega:');
    if (nuevo && !this.tiposEntrega.includes(nuevo)) {
      this.catalogoService.agregarItem('tiposEntrega', { nombre: nuevo });
    }
  }
}
