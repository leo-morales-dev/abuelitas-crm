import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FidelizacionService } from '../fidelizacion/fidelizacion.service';
import { ClienteService } from '../clientes/cliente.service';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private firestore = inject(Firestore);
  private fidelizacionService = inject(FidelizacionService);
  private clienteService = inject(ClienteService);

  obtenerPedidos(): Observable<any[]> {
    const ref = collection(this.firestore, 'pedidos');
    return collectionData(ref, { idField: 'id' });
  }

  async agregarPedido(pedido: any) {
    const clienteRef = doc(this.firestore, `clientes/${pedido.clienteId}`);
    const clienteSnap = await getDoc(clienteRef);
    const tipoCliente = clienteSnap.exists() ? clienteSnap.data()['tipoCliente'] || 'Tradicional' : 'Tradicional';

    let precioFinal = pedido.precioFinal || 0;

    // ✅ Aplicar descuento según tipo de cliente
    if (tipoCliente === 'Premier') {
      precioFinal = precioFinal * 0.95;
    } else if (tipoCliente === 'VIP') {
      precioFinal = precioFinal * 0.90;
      pedido.tipoEntrega = 'Envío gratuito'; // Reemplaza tipo de entrega
    }

    // ✅ Redondear a 2 decimales
    pedido.precioFinal = parseFloat(precioFinal.toFixed(2));

    // ✅ Guardar el pedido con descuentos aplicados
    const ref = collection(this.firestore, 'pedidos');
    const res = await addDoc(ref, pedido);

    // ✅ Asignar puntos incluyendo día especial y combos
    await this.fidelizacionService.asignarPuntos(
      pedido.clienteId,
      tipoCliente,
      pedido.precioFinal,
      pedido.tipoPizza
    );

    return res;
  }
}
