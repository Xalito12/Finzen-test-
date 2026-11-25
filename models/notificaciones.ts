import { resumirGastos, type CategoriaResumen, type GastoResumen, } from "../database/consultasFinanzas";
import type { MetaAhorro } from "../database/metasService";

// Define los niveles de importancia de las notificaciones.
export type NivelNotificacion = "critica" | "aviso" | "logro";
// Define la información que contiene cada notificación.
export interface NotificacionFinzen {
  id: string;
  titulo: string;
  descripcion: string;
  severidad: NivelNotificacion;
  destino: 2 | 3 | 5;
  accion: string;
}
// Define los datos financieros necesarios para generar las alertas.
export interface DatosNotificaciones {
  perfil: { sueldo?: unknown } | null;
  gastos: ReadonlyArray<Pick<GastoResumen, "monto" | "categoria">>;
  categorias: ReadonlyArray<CategoriaResumen>;
}

// Establece el orden de prioridad de las notificaciones.
const pesos: Record<NivelNotificacion, number> = {
  critica: 0,
  aviso: 1,
  logro: 2,
};
// Presenta un monto con el símbolo de dinero y el formato numérico de Chile.
const dinero = (monto: number) => `$${monto.toLocaleString("es-CL")}`;
// Presenta un porcentaje con hasta un decimal.
const porcentaje = (valor: number) => `${Number(valor.toFixed(1))} %`;

// Convierte el día local de una fecha a un valor numérico para comparar días.
function diaCalendarioLocal(fecha: Date): number | null {
  // Devuelve null si el objeto recibido contiene una fecha inválida.
  if (!Number.isFinite(fecha.getTime())) return null;
  return (
    Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) / 86400000
  );
}

// Valida una fecha escrita como AAAA-MM-DD y la convierte a un número de día.
function diaDeFecha(fecha: string | null): number | null {
  // Rechaza las fechas ausentes o con un formato incorrecto.
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  const [anio, mes, dia] = fecha.split("-").map(Number);
  // Rechaza los años fuera del intervalo permitido.
  if (anio < 1000 || anio > 9999) return null;
  const comprobacion = new Date(anio, mes - 1, dia, 12);
  // Comprueba que el año, mes y día formen una fecha real.
  if (
    comprobacion.getFullYear() !== anio ||
    comprobacion.getMonth() !== mes - 1 ||
    comprobacion.getDate() !== dia
  )
    return null;
  return Date.UTC(anio, mes - 1, dia) / 86400000;
}

/** Alertas activas: se vuelven a calcular cuando cambian los datos, sin historial ficticio. */
// Genera las notificaciones del presupuesto, las categorías y las metas.
// Devuelve las alertas ordenadas según su importancia.
export function generarNotificaciones(
  datos: DatosNotificaciones | null,
  metas: ReadonlyArray<MetaAhorro>,
  ahora = new Date(),
): NotificacionFinzen[] {
  const alertas = new Map<string, NotificacionFinzen>();
  // Guarda cada alerta por su identificador para evitar duplicados.
  const agregar = (alerta: NotificacionFinzen) =>
    alertas.set(alerta.id, alerta);
  // Si hay datos financieros, revisa el presupuesto y las categorías.
  if (datos) {
    const resumen = resumirGastos(datos.gastos);
    const sueldo = Number(datos.perfil?.sueldo);
    // Evalúa el presupuesto cuando el sueldo es positivo y los montos son válidos.
    if (
      Number.isFinite(sueldo) &&
      sueldo > 0 &&
      Number.isFinite(resumen.total)
    ) {
      const saldo = sueldo - Math.max(0, resumen.total);
      const restante = (saldo / sueldo) * 100;
      // Si los gastos superan el sueldo, agrega una alerta crítica.
      if (saldo < 0)
        agregar({
          id: "presupuesto",
          severidad: "critica",
          titulo: "Presupuesto excedido",
          descripcion: `Tus gastos superan el sueldo configurado por ${dinero(-saldo)}.`,
          destino: 2,
          accion: "Ver presupuesto",
        });
      // Si el saldo llegó a cero, informa que el presupuesto está agotado.
      else if (saldo === 0)
        agregar({
          id: "presupuesto",
          severidad: "critica",
          titulo: "Presupuesto agotado",
          descripcion: "Ya utilizaste todo el sueldo configurado en Inicio.",
          destino: 2,
          accion: "Ver presupuesto",
        });
      // Si queda el 20 % o menos, agrega una alerta de presupuesto crítico.
      else if (restante <= 20)
        agregar({
          id: "presupuesto",
          severidad: "critica",
          titulo: "Presupuesto en estado crítico",
          descripcion: `Quedan ${dinero(saldo)} (${porcentaje(restante)} del sueldo configurado).`,
          destino: 2,
          accion: "Ver presupuesto",
        });
      // Si queda más del 20 % y hasta el 40 %, agrega un aviso de atención.
      else if (restante <= 40)
        agregar({
          id: "presupuesto",
          severidad: "aviso",
          titulo: "Tu presupuesto necesita atención",
          descripcion: `Quedan ${dinero(saldo)} (${porcentaje(restante)} del sueldo configurado).`,
          destino: 2,
          accion: "Ver presupuesto",
        });
    }
    // Compara el gasto de cada categoría con su límite configurado.
    for (const categoria of datos.categorias) {
      const limite = Number(categoria.limite),
        gastado = resumen.gastoCategoria(categoria.nombre);
      // Omite la categoría si su límite o su gasto no permiten calcular el avance.
      if (!Number.isFinite(limite) || limite <= 0 || !Number.isFinite(gastado))
        continue;
      const usado = (gastado / limite) * 100;
      // Si se alcanza o supera el límite, agrega una alerta crítica.
      if (usado >= 100)
        agregar({
          id: `categoria:${categoria.id}`,
          severidad: "critica",
          titulo: `${gastado > limite ? "Límite excedido" : "Límite alcanzado"}: ${categoria.nombre}`,
          descripcion: `Llevas ${dinero(gastado)} de ${dinero(limite)} (${porcentaje(usado)}).`,
          destino: 3,
          accion: "Ver categorías",
        });
      // Si se ha utilizado desde el 80 % hasta menos del 100 %, agrega un aviso.
      else if (usado >= 80)
        agregar({
          id: `categoria:${categoria.id}`,
          severidad: "aviso",
          titulo: `Cerca del límite: ${categoria.nombre}`,
          descripcion: `Llevas ${dinero(gastado)} de ${dinero(limite)} (${porcentaje(usado)}).`,
          destino: 3,
          accion: "Ver categorías",
        });
    }
  }
  const hoy = diaCalendarioLocal(ahora);
  // Revisa el avance y la fecha objetivo de cada meta de ahorro.
  for (const meta of metas) {
    const objetivo = Number(meta.monto_objetivo),
      ahorrado = Number(meta.monto_ahorrado);
    // Omite las metas cuyo objetivo o ahorro contienen montos inválidos.
    if (
      !Number.isFinite(objetivo) ||
      objetivo <= 0 ||
      !Number.isFinite(ahorrado) ||
      ahorrado < 0
    )
      continue;
    // Si el ahorro alcanza el objetivo, registra el logro y pasa a la siguiente meta.
    if (ahorrado >= objetivo) {
      agregar({
        id: `meta:${meta.id}`,
        severidad: "logro",
        titulo: `¡Meta alcanzada!: ${meta.nombre}`,
        descripcion: `Registraste ${dinero(ahorrado)} y tu objetivo era ${dinero(objetivo)}.`,
        destino: 5,
        accion: "Ver metas",
      });
      continue;
    }
    const fecha = diaDeFecha(meta.fecha_objetivo);
    // Omite las alertas por vencimiento si alguna de las fechas es inválida.
    if (fecha === null || hoy === null) continue;
    const dias = fecha - hoy,
      faltante = dinero(objetivo - ahorrado);
    // Si la fecha objetivo ya pasó, agrega una alerta crítica.
    if (dias < 0)
      agregar({
        id: `meta:${meta.id}`,
        severidad: "critica",
        titulo: `Fecha vencida: ${meta.nombre}`,
        descripcion: `La fecha objetivo ya pasó. Faltan ${faltante} para completar la meta.`,
        destino: 5,
        accion: "Ver metas",
      });
    // Si la meta vence hoy o dentro de los próximos siete días, agrega un aviso.
    else if (dias <= 7)
      agregar({
        id: `meta:${meta.id}`,
        severidad: "aviso",
        titulo: `${dias === 0 ? "Tu meta vence hoy" : "Tu meta vence pronto"}: ${meta.nombre}`,
        descripcion: `${dias === 0 ? "La fecha objetivo es hoy" : `Quedan ${dias} ${dias === 1 ? "día" : "días"}`}. Faltan ${faltante} para completarla.`,
        destino: 5,
        accion: "Ver metas",
      });
  }
  // Ordena primero por importancia y, cuando coinciden, por identificador.
  return [...alertas.values()].sort(
    (a, b) =>
      pesos[a.severidad] - pesos[b.severidad] || a.id.localeCompare(b.id),
  );
}