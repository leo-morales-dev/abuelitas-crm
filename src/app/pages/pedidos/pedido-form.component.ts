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
import { Promocion } from '../../models/promocion.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-pedido-form',
  templateUrl: './pedido-form.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, AsyncPipe, CurrencyPipe]
})
export class PedidoFormComponent implements OnInit {
  form!: FormGroup;
  fb = inject(FormBuilder);
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
  promociones: Promocion[] = [];

  tipoClienteActual = 'Tradicional';
  promoAplicada: string = '';

  async ngOnInit() {
    this.form = this.fb.group({
      clienteId: ['', Validators.required],
      fechaHora: [this.getFechaActual(), Validators.required],
      pizzas: this.fb.array([this.crearPizzaGroup()]),
      metodoPago: ['', Validators.required],
      tipoEntrega: ['', Validators.required],
      precioFinal: [0],
      promoAplicada: [''],
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

    this.catalogoService.obtenerPromociones().subscribe(promos => {
      this.promociones = promos;
      this.recalcularPrecio();
    });

    this.form.get('clienteId')?.valueChanges.subscribe(clienteId => {
      this.clienteService.obtenerClientes().subscribe(clientes => {
        const cliente = clientes.find(c => c.id === clienteId);
        this.tipoClienteActual = cliente?.tipoCliente || 'Tradicional';
        this.recalcularPrecio();
      });
    });

    this.pizzasArray.valueChanges.subscribe(() => this.recalcularPrecio());
    this.form.get('tipoEntrega')?.valueChanges.subscribe(() => this.recalcularPrecio());
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
    if (!this.pizzasArray || this.pizzasArray.length === 0) return;
    const pizzas = this.pizzasArray.getRawValue();
    if (pizzas.some(p => !p.tipo)) return;

    const hoy = new Date();
    const dia = hoy.toLocaleDateString('es-MX', { weekday: 'long' }).toLowerCase();

    // Verificamos si hay promoción aplicable
    const tipoEntregaSeleccionado = this.form.get('tipoEntrega')?.value;

    const promoActiva = this.promociones.find(promo => {
      const desde = new Date(promo.fechaInicio);
      const hasta = new Date(promo.fechaFin);
      const cumpleDia = promo.diasValidos?.includes(dia);
      const cumpleCantidad = promo.condiciones?.minimoPizzas
        ? pizzas.length >= promo.condiciones.minimoPizzas
        : true;
      const cumpleTipoPizza = promo.condiciones?.tipoPizzaAplicable
        ? pizzas.every(p => p.tipo === promo.condiciones.tipoPizzaAplicable)
        : true;
      const cumpleEntrega = promo.tipoEntrega
        ? promo.tipoEntrega === tipoEntregaSeleccionado
        : true;

      return (
        desde <= hoy &&
        hoy <= hasta &&
        cumpleDia &&
        cumpleCantidad &&
        cumpleTipoPizza &&
        cumpleEntrega
      );
    });


    let total = 0;
    this.promoAplicada = '';

    if (promoActiva && promoActiva.condiciones?.tipoPizzaAplicable && promoActiva.precio) {
      const tipoPromo = promoActiva.condiciones.tipoPizzaAplicable;
      const minPizzas = promoActiva.condiciones.minimoPizzas || 0;

      const pizzasPromo = pizzas.filter(p => p.tipo === tipoPromo);
      const pizzasNoPromo = pizzas.filter(p => p.tipo !== tipoPromo);

      const grupos = Math.floor(pizzasPromo.length / minPizzas);
      const resto = pizzasPromo.length % minPizzas;

      total += grupos * promoActiva.precio;

      for (let i = 0; i < resto; i++) {
        total += this.preciosCatalogo[tipoPromo] || 0;
      }

      for (const p of pizzasNoPromo) {
        total += this.preciosCatalogo[p.tipo] || 0;
      }

      this.promoAplicada = grupos > 0 ? promoActiva.nombre : '';
    } else {
      for (const p of pizzas) {
        total += this.preciosCatalogo[p.tipo] || 0;
      }
    }

    // Descuento por tipo de cliente
    if (this.tipoClienteActual === 'Premier') {
      total *= 0.95;
    } else if (this.tipoClienteActual === 'VIP') {
      total *= 0.90;
    }

    total = parseFloat(total.toFixed(2));
    this.form.patchValue({ precioFinal: total, promoAplicada: this.promoAplicada }, { emitEvent: false });
  }

  async guardarPedido() {
    const clienteId = this.form.get('clienteId')?.value;
    if (!clienteId || this.pizzasArray.length === 0) return;

    const pedido: Pedido = this.form.getRawValue();

    await this.pedidoService.crearPedido(pedido);
    await this.clienteService.agregarPuntos(clienteId, this.calcularPuntos(pedido.precioFinal, this.promoAplicada, pedido.fechaHora));

    this.form.reset();
    this.pizzasArray.clear();
    this.pizzasArray.push(this.crearPizzaGroup());
    this.form.patchValue({ fechaHora: this.getFechaActual(), estado: 'En progreso' });
    this.promoAplicada = '';
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
