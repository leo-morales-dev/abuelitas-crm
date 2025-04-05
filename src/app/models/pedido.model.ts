export interface Pizza {
  tipo: string;
  ingredientes: string[];
  especialidad?: string;
}

export interface Pedido {
  id?: string;
  clienteId: string;
  fechaHora: string;
  pizzas: Pizza[];
  metodoPago: string;
  tipoEntrega: string;
  precioFinal: number;
  promoAplicada?: string; // ✅ CAMBIO
  estado: 'En progreso' | 'Finalizado';
  fechaCierre?: string;
}
