// Define los datos utilizados para mostrar el estado del presupuesto.
export interface EstadoPresupuesto {
  porcentajeDisponible: number | null;
  color: string;
  etiqueta: string;
  mensaje: string;
}

// Se calcula con el saldo mostrado en Inicio, sin introducir otra fuente de datos.
// Determina el porcentaje disponible y devuelve el color, la etiqueta
// y el mensaje correspondientes al saldo restante.
export function calcularEstadoPresupuesto(
  sueldo: number,
  gastado: number,
): EstadoPresupuesto {
  // Si el sueldo es inválido o no es positivo, o los gastos son inválidos,
  // devuelve un estado que solicita configurar el presupuesto.
  if (!Number.isFinite(sueldo) || sueldo <= 0 || !Number.isFinite(gastado)) {
    return {
      porcentajeDisponible: null,
      color: "#E9D5FF",
      etiqueta: "Sin presupuesto",
      mensaje: "Configura tu sueldo para ver el estado de tu presupuesto.",
    };
  }
  // Calcula el saldo tomando los gastos negativos como cero.
  const saldo = sueldo - Math.max(0, gastado);
  const porcentajeDisponible = (saldo / sueldo) * 100;
  // Si queda el 20 % o menos, utiliza el color rojo.
  // Distingue entre presupuesto excedido, agotado o en estado crítico.
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
  // Si queda más del 20 % y hasta el 40 %, muestra una advertencia amarilla.
  if (porcentajeDisponible <= 40) {
    return {
      porcentajeDisponible,
      color: "#FDE047",
      etiqueta: "Atención",
      mensaje: "Te queda entre el 20 % y el 40 % de tu presupuesto.",
    };
  }
  // Si queda más del 40 %, muestra el estado verde con margen disponible.
  return {
    porcentajeDisponible,
    color: "#86EFAC",
    etiqueta: "Con margen",
    mensaje: "Aún tienes más del 40 % de tu presupuesto disponible.",
  };
}