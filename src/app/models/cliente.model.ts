export interface Cliente {
  id?: string;
  nombre: string;
  telefono: string;
  correo?: string;
  direccion: string;
  sexo?: string;
  cumple?: string;
  preferenciasEntrega?: string;
  metodosPago?: string;
  tipoCliente?: string;
  puntos?: number;
  ultimaCompra?: string;
  recompensa?: string;
}
