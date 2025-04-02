import { Injectable, inject } from '@angular/core';
import { Firestore, doc, updateDoc, getDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class FidelizacionService {
  private firestore = inject(Firestore);

  private esDiaEspecial(): boolean {
    const dia = new Date().getDay(); // 5 = viernes, 6 = sábado
    return dia === 5 || dia === 6;
  }

  private esCombo(tipoPizza: string): boolean {
    return ['Combo Familiar', 'Combo Fiesta', 'Combo Empresarial'].includes(tipoPizza);
  }

  calcularPuntosBase(tipoCliente: string, total: number): number {
    switch (tipoCliente) {
      case 'VIP': return total * 2;
      case 'Premier': return total * 1.5;
      default: return total;
    }
  }

  async asignarPuntos(clienteId: string, tipoCliente: string, total: number, tipoPizza: string) {
    let puntos = this.calcularPuntosBase(tipoCliente, total);

    // 🔸 Día especial (viernes o sábado) → puntos x2
    if (this.esDiaEspecial()) {
      puntos *= 2;
    }

    // 🔸 Combo → +10%
    if (this.esCombo(tipoPizza)) {
      puntos *= 1.1;
    }

    const clienteRef = doc(this.firestore, `clientes/${clienteId}`);
    const clienteSnap = await getDoc(clienteRef);

    const datosExistentes = clienteSnap.exists() ? clienteSnap.data() : {};
    const puntosActuales = datosExistentes['puntos'] || 0;

    await updateDoc(clienteRef, {
      puntos: Math.floor(puntosActuales + puntos),
      ultimaCompra: new Date().toISOString()
    });
  }

  async aplicarRecompensaSiAplica(clienteId: string, puntosActuales: number) {
    if (puntosActuales >= 100) {
      const clienteRef = doc(this.firestore, `clientes/${clienteId}`);
      await updateDoc(clienteRef, {
        puntos: puntosActuales - 100,
        recompensa: 'Recompensa aplicada'
      });
    }
  }

  async aplicarRecompensaManual(clienteId: string, recompensa: string) {
    const clienteRef = doc(this.firestore, `clientes/${clienteId}`);
    await updateDoc(clienteRef, {
      puntos: 0,
      recompensa
    });
  }  
}
