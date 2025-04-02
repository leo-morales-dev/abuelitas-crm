import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreciosService } from './precios.service';
import { AsyncPipe, NgFor } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-precios-promociones',
  standalone: true,
  imports: [CommonModule, NgFor, AsyncPipe, ReactiveFormsModule],
  templateUrl: './precios-promociones.page.html',
  styleUrls: ['./precios-promociones.page.css']
})
export class PreciosPromocionesPage implements OnInit {
  private preciosService = inject(PreciosService);
  private fb = inject(FormBuilder);

  precios$ = this.preciosService.obtenerPrecios();
  combos$ = this.preciosService.obtenerCombos();
  promociones$ = this.preciosService.obtenerPromociones();

  formPrecio!: FormGroup;
  formCombo!: FormGroup;
  formPromo!: FormGroup;

  editandoPrecio: any = null;
  editandoCombo: any = null;
  editandoPromo: any = null;

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  ngOnInit(): void {
    this.formPrecio = this.fb.group({
      tamaño: ['', Validators.required],
      precio: ['', Validators.required],
    });

    this.formCombo = this.fb.group({
      nombre: ['', Validators.required],
      precio: ['', Validators.required],
      descripcion: ['', Validators.required],
    });

    this.formPromo = this.fb.group({
      nombre: ['', Validators.required],
      dias: [[], Validators.required],
      precioPersonal: [null, Validators.required],
      precioMediana: [null, Validators.required],
      precioFamiliar: [null, Validators.required],
      restricciones: ['']
    });
  }

  // ===== PRECIOS =====
  editarPrecio(p: any) {
    this.editandoPrecio = p;
    this.formPrecio.setValue({ tamaño: p.tamaño, precio: p.precio });
  }

  guardarPrecio() {
    if (this.formPrecio.invalid) return;
    const data = this.formPrecio.value;

    if (this.editandoPrecio) {
      this.preciosService.actualizarPrecio(this.editandoPrecio.id, data).then(() => {
        this.editandoPrecio = null;
        this.formPrecio.reset();
      });
    } else {
      this.preciosService.agregarPrecio(data).then(() => this.formPrecio.reset());
    }
  }

  eliminarPrecio(id: string) {
    if (confirm('¿Seguro que deseas eliminar este precio?')) {
      this.preciosService.eliminarPrecio(id);
    }
  }

  // ===== COMBOS =====
  editarCombo(combo: any) {
    this.editandoCombo = combo;
    this.formCombo.setValue({
      nombre: combo.nombre,
      precio: combo.precio,
      descripcion: combo.descripcion
    });
  }

  guardarCombo() {
    if (this.formCombo.invalid) return;
    const data = this.formCombo.value;

    if (this.editandoCombo) {
      this.preciosService.actualizarCombo(this.editandoCombo.id, data).then(() => {
        this.editandoCombo = null;
        this.formCombo.reset();
      });
    } else {
      this.preciosService.agregarCombo(data).then(() => this.formCombo.reset());
    }
  }

  eliminarCombo(id: string) {
    if (confirm('¿Eliminar este combo?')) {
      this.preciosService.eliminarCombo(id);
    }
  }

  // ===== PROMOCIONES =====
  editarPromocion(promo: any) {
    this.editandoPromo = promo;
    this.formPromo.setValue({
      nombre: promo.nombre,
      dias: promo.dias,
      precioPersonal: promo.precioPersonal,
      precioMediana: promo.precioMediana,
      precioFamiliar: promo.precioFamiliar,
      restricciones: promo.restricciones || ''
    });
  }

  guardarPromocion() {
    if (this.formPromo.invalid) return;
    const data = this.formPromo.value;

    if (this.editandoPromo) {
      this.preciosService.actualizarPromocion(this.editandoPromo.id, data).then(() => {
        this.editandoPromo = null;
        this.formPromo.reset();
      });
    } else {
      this.preciosService.agregarPromocion(data).then(() => this.formPromo.reset());
    }
  }

  eliminarPromocion(id: string) {
    if (confirm('¿Eliminar esta promoción?')) {
      this.preciosService.eliminarPromocion(id);
    }
  }

  onDiaChange(event: any) {
    const value = event.target.value;
    const checked = event.target.checked;
    const currentDias = this.formPromo.value.dias || [];

    if (checked && !currentDias.includes(value)) {
      this.formPromo.patchValue({ dias: [...currentDias, value] });
    } else if (!checked) {
      this.formPromo.patchValue({ dias: currentDias.filter((d: string) => d !== value) });
    }
  }
}
