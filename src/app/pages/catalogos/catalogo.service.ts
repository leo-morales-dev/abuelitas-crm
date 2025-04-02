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
}
