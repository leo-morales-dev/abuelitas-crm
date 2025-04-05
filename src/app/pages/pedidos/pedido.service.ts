import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  getDoc
} from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { FidelizacionService } from '../fidelizacion/fidelizacion.service';
import { ClienteService } from '../clientes/cliente.service';
import { CatalogoService } from '../catalogos/catalogo.service';
import { Pedido } from '../../models/pedido.model';
import { Promocion } from '../../models/promocion.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private firestore = inject(Firestore);
  private fidelizacionService = inject(FidelizacionService);
  private clienteService = inject(ClienteService);
  private catalogoService = inject(CatalogoService);

  obtenerPedidos(): Observable<any[]> {
    const ref = collection(this.firestore, 'pedidos');
    return collectionData(ref, { idField: 'id' });
  }

  async crearPedido(pedido: Pedido) {
    const clienteRef = doc(this.firestore, `clientes/${pedido.clienteId}`);
    const clienteSnap = await getDoc(clienteRef);
    const tipoCliente = clienteSnap.exists()
      ? clienteSnap.data()['tipoCliente'] || 'Tradicional'
      : 'Tradicional';

    let total = 0;
    const pizzas = pedido.pizzas || [];

    // 🔥 Obtener promociones válidas
    const promociones: Promocion[] = await firstValueFrom(this.catalogoService.obtenerPromociones());
    const hoy = new Date();
    const diaActual = hoy.toLocaleDateString('es-MX', { weekday: 'long' }).toLowerCase();

    const promocionesValidas = promociones.filter(promo => {
      const desde = new Date(promo.fechaInicio);
      const hasta = new Date(promo.fechaFin);

      const cumpleFecha = desde <= hoy && hoy <= hasta;
      const cumpleDia = promo.diasValidos.includes(diaActual);
      const cumpleEntrega = promo.tipoEntrega ? promo.tipoEntrega === pedido.tipoEntrega : true;

      return cumpleFecha && cumpleDia && cumpleEntrega;
    });

    // Aplicar promoción por grupo de pizzas de cierto tipo
    let promoAplicada = '';
    for (const promo of promocionesValidas) {
      const tipoPizza = promo.condiciones?.tipoPizzaAplicable;
      const minPizzas = promo.condiciones?.minimoPizzas || 0;

      if (tipoPizza && promo.precio) {
        const pizzasPromo = pizzas.filter(p => p.tipo === tipoPizza);
        const pizzasNoPromo = pizzas.filter(p => p.tipo !== tipoPizza);

        const grupos = Math.floor(pizzasPromo.length / minPizzas);
        const sobrantes = pizzasPromo.length % minPizzas;

        if (grupos > 0) {
          total += grupos * promo.precio;

          for (let i = 0; i < sobrantes; i++) {
            total += await this.obtenerPrecioPizza(pizzasPromo[i].tipo);
          }

          for (const p of pizzasNoPromo) {
            total += await this.obtenerPrecioPizza(p.tipo);
          }

          promoAplicada = promo.nombre;
          break; // ✅ Aplicamos solo una promoción
        }
      } else if (!tipoPizza && promo.precio && pizzas.length >= minPizzas) {
        total = promo.precio;
        promoAplicada = promo.nombre;
        break;
      }
    }

    // Si no hubo promo aplicada, calcular precio normal
    if (!promoAplicada) {
      for (const p of pizzas) {
        total += await this.obtenerPrecioPizza(p.tipo);
      }
    }

    // ✅ Descuento por tipo de cliente
    if (tipoCliente === 'Premier') {
      total *= 0.95;
    } else if (tipoCliente === 'VIP') {
      total *= 0.90;
      pedido.tipoEntrega = 'Envío gratuito'; // Solo para mostrarlo al cliente
    }

    pedido.precioFinal = parseFloat(total.toFixed(2));
    pedido.promoAplicada = promoAplicada;

    const ref = collection(this.firestore, 'pedidos');
    const res = await addDoc(ref, pedido);

    await this.fidelizacionService.asignarPuntos(
      pedido.clienteId,
      tipoCliente,
      pedido.precioFinal,
      pizzas.length > 0 ? pizzas[0].tipo : ''
    );

    return res;
  }

  private async obtenerPrecioPizza(tipo: string): Promise<number> {
    const tiposPizza = await firstValueFrom(this.catalogoService.obtenerLista('tiposPizza'));
    const tipoEncontrado = tiposPizza.find(p => p.nombre === tipo);
    return tipoEncontrado?.precio || 0;
  }
}
