import { Injectable, inject } from '@angular/core';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Promocion } from '../../models/promocion.model';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private firestore = inject(Firestore);

  obtenerLista(path: string): Observable<any[]> {
    const ref = collection(this.firestore, path);
    const q = query(ref, orderBy('nombre'));
    return collectionData(q, { idField: 'id' });
  }

  agregarItem(path: string, item: { nombre: string; precio?: number }) {
    const ref = collection(this.firestore, path);
    return addDoc(ref, item);
  }

  eliminarItem(path: string, id: string) {
    const ref = doc(this.firestore, `${path}/${id}`);
    return deleteDoc(ref);
  }

  actualizarItem(path: string, id: string, data: { nombre: string; precio?: number }) {
    const ref = doc(this.firestore, `${path}/${id}`);
    return updateDoc(ref, data);
  }

  // Tipos de Cliente como array
  getTiposCliente(): Observable<string[]> {
    const ref = collection(this.firestore, 'tiposCliente');
    return collectionData(ref, { idField: 'id' }).pipe(
      map((items: any[]) => items.map(item => item.nombre))
    );
  }

  // Promociones CRUD
  obtenerPromociones(): Observable<Promocion[]> {
    const ref = collection(this.firestore, 'promociones');
    return collectionData(ref, { idField: 'id' }) as Observable<Promocion[]>;
  }

  agregarPromocion(promo: Promocion) {
    const ref = collection(this.firestore, 'promociones');
    return addDoc(ref, promo);
  }

  actualizarPromocion(id: string, data: Partial<Promocion>) {
    const ref = doc(this.firestore, `promociones/${id}`);
    return updateDoc(ref, data);
  }

  eliminarPromocion(id: string) {
    const ref = doc(this.firestore, `promociones/${id}`);
    return deleteDoc(ref);
  }
}
