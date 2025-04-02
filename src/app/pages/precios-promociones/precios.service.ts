import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PreciosService {
  private firestore = inject(Firestore);

  // 🔸 Precios por tamaño
  obtenerPrecios(): Observable<any[]> {
    const ref = collection(this.firestore, 'precios');
    return collectionData(ref, { idField: 'id' });
  }

  agregarPrecio(precio: any) {
    const ref = collection(this.firestore, 'precios');
    return addDoc(ref, precio);
  }

  actualizarPrecio(id: string, data: any) {
    const ref = doc(this.firestore, `precios/${id}`);
    return updateDoc(ref, data);
  }

  eliminarPrecio(id: string) {
    const ref = doc(this.firestore, `precios/${id}`);
    return deleteDoc(ref);
  }

  // 🔸 Combos
  obtenerCombos(): Observable<any[]> {
    const ref = collection(this.firestore, 'combos');
    return collectionData(ref, { idField: 'id' });
  }

  agregarCombo(combo: any) {
    const ref = collection(this.firestore, 'combos');
    return addDoc(ref, combo);
  }

  actualizarCombo(id: string, data: any) {
    const ref = doc(this.firestore, `combos/${id}`);
    return updateDoc(ref, data);
  }

  eliminarCombo(id: string) {
    const ref = doc(this.firestore, `combos/${id}`);
    return deleteDoc(ref);
  }

  // 🔸 Promociones
  obtenerPromociones(): Observable<any[]> {
    const ref = collection(this.firestore, 'promociones');
    return collectionData(ref, { idField: 'id' });
  }

  agregarPromocion(promo: any) {
    const ref = collection(this.firestore, 'promociones');
    return addDoc(ref, promo);
  }

  actualizarPromocion(id: string, data: any) {
    const ref = doc(this.firestore, `promociones/${id}`);
    return updateDoc(ref, data);
  }

  eliminarPromocion(id: string) {
    const ref = doc(this.firestore, `promociones/${id}`);
    return deleteDoc(ref);
  }
}
