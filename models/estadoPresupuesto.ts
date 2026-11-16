export interface EstadoPresupuesto {
  porcentajeDisponible: number | null;
  color: string;
  etiqueta: string;
  mensaje: string;
}

// Se calcula con el saldo mostrado en Inicio, sin introducir otra fuente de datos.
export function calcularEstadoPresupuesto(
  sueldo: number,
  gastado: number,
): EstadoPresupuesto {
  if (!Number.isFinite(sueldo) || sueldo <= 0 || !Number.isFinite(gastado)) {
    return {
      porcentajeDisponible: null,
      color: "#E9D5FF",
      etiqueta: "Sin presupuesto",
      mensaje: "Configura tu sueldo para ver el estado de tu presupuesto.",
    };
  }
  const saldo = sueldo - Math.max(0, gastado);
  const porcentajeDisponible = (saldo / sueldo) * 100;
  if (porcentajeDisponible <= 20) {
    return {
      porcentajeDisponible,
      color: "#FCA5A5",
      etiqueta:
        saldo < 0
          ? "Presupuesto excedido"
          : saldo === 0
            ? "Presupuesto agotado"
            : "Crítico",
      mensaje:
        saldo < 0
          ? "Tus gastos superan el sueldo configurado."
          : saldo === 0
            ? "Ya utilizaste todo tu presupuesto."
            : "Te queda el 20 % o menos de tu presupuesto.",
    };
  }
  if (porcentajeDisponible <= 40) {
    return {
      porcentajeDisponible,
      color: "#FDE047",
      etiqueta: "Atención",
      mensaje: "Te queda entre el 20 % y el 40 % de tu presupuesto.",
    };
  }
  return {
    porcentajeDisponible,
    color: "#86EFAC",
    etiqueta: "Con margen",
    mensaje: "Aún tienes más del 40 % de tu presupuesto disponible.",
  };
}
