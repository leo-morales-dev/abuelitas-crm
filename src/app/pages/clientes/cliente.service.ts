import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Cliente } from '../../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private firestore = inject(Firestore);

  obtenerClientes(): Observable<Cliente[]> {
    const ref = collection(this.firestore, 'clientes');
    return collectionData(ref, { idField: 'id' }) as Observable<Cliente[]>;
  }

  agregarCliente(cliente: Cliente) {
    const ref = collection(this.firestore, 'clientes');

    const clienteConBienvenida: any = {
      ...cliente,
      puntos: 100
    };

    if (cliente.ultimaCompra !== undefined) {
      clienteConBienvenida.ultimaCompra = cliente.ultimaCompra;
    }

    if (cliente.recompensa !== undefined) {
      clienteConBienvenida.recompensa = cliente.recompensa;
    }

    return addDoc(ref, clienteConBienvenida);
  }

  actualizarCliente(id: string, data: Partial<Cliente>) {
    const ref = doc(this.firestore, `clientes/${id}`);
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    return updateDoc(ref, cleanData);
  }

  eliminarCliente(id: string) {
    const ref = doc(this.firestore, `clientes/${id}`);
    return deleteDoc(ref);
  }

  async agregarPuntos(clienteId: string, puntos: number) {
    const ref = doc(this.firestore, `clientes/${clienteId}`);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const clienteData = snap.data() as Cliente;
      const puntosActuales = clienteData.puntos || 0;
      await updateDoc(ref, {
        puntos: puntosActuales + puntos,
        ultimaCompra: new Date().toISOString()
      });
    }
  }

  obtenerPreferenciasEntrega(): Observable<any[]> {
    const ref = collection(this.firestore, 'catalogos/tiposEntrega/items');
    return collectionData(ref);
  }
}
