export interface Promocion {
    id?: string;
    nombre: string;
    precio?: number;
    fechaInicio: string;
    fechaFin: string;
    diasValidos: string[];
    tipoEntrega?: string; // 👈 importante
    condiciones: {
      minimoPizzas?: number;
      tipoPizzaAplicable?: string;
    };
  }
  