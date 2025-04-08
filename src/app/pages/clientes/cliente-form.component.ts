import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { ClienteService } from '../clientes/cliente.service';
import { Cliente } from '../../models/cliente.model';
import { CatalogoService } from '../catalogos/catalogo.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-cliente-form',
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
})

export class ClienteFormComponent implements OnInit, OnChanges {
  @Input() cliente?: Cliente;

  form!: FormGroup;
  fb = inject(FormBuilder);
  clienteService = inject(ClienteService);
  catalogoService = inject(CatalogoService);

  tipoClienteActivo = true;
  metodosPago: string[] = [];
  preferenciasEntrega: string[] = [];
  tiposCliente: string[] = [];

  ngOnInit(): void {
    this.inicializarFormulario();

    this.catalogoService.obtenerLista('metodosPago').subscribe(lista => {
      this.metodosPago = lista.map(e => e.nombre);
    });

    this.catalogoService.obtenerLista('tiposEntrega').subscribe(lista => {
      this.preferenciasEntrega = lista.map(e => e.nombre);
    });

    this.catalogoService.obtenerLista('tiposCliente').subscribe(lista => {
      this.tiposCliente = lista.map(e => e.nombre);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cliente'] && this.cliente) {
      this.form.patchValue(this.cliente);
      this.tipoClienteActivo = !!this.cliente.tipoCliente;

      if (!this.tipoClienteActivo) {
        this.form.get('tipoCliente')?.disable();
      } else {
        this.form.get('tipoCliente')?.enable();
      }
    }
  }

  private inicializarFormulario() {
    this.form = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/)
      ]],
      telefono: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/)
      ]],
      correo: ['', Validators.email],
      direccion: ['', Validators.required],
      sexo: [''],
      cumple: [''],
      preferenciasEntrega: [''],
      metodosPago: [''],
      tipoCliente: ['']
    });
  }

  onTelefonoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const soloNumeros = input.value.replace(/[^0-9]/g, '');
    this.form.get('telefono')?.setValue(soloNumeros, { emitEvent: false });
  }

  toggleTipoCliente(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.tipoClienteActivo = !checked;

    if (checked) {
      this.form.get('tipoCliente')?.disable();
      this.form.get('tipoCliente')?.setValue('');
    } else {
      this.form.get('tipoCliente')?.enable();
    }
  }

  guardarCliente() {
    if (this.form.invalid) return;

    const clienteData: Cliente = this.form.getRawValue();

    if (this.cliente?.id) {
      this.clienteService.actualizarCliente(this.cliente.id, clienteData);
    } else {
      this.clienteService.agregarCliente(clienteData);
    }

    this.form.reset();
    this.tipoClienteActivo = true;
    this.form.get('tipoCliente')?.enable();

    this.form.patchValue({
      nombre: '',
      telefono: '',
      correo: '',
      direccion: '',
      sexo: '',
      cumple: '',
      preferenciasEntrega: '',
      metodosPago: '',
      tipoCliente: ''
    });
  }
}
