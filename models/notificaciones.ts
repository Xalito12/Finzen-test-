import type { MetaAhorro } from "../database/metasService";
import {
  resumirGastos,
  type CategoriaResumen,
  type GastoResumen,
} from "../database/consultasFinanzas";

export type NivelNotificacion = "critica" | "aviso" | "logro";
export interface NotificacionFinzen {
  id: string;
  titulo: string;
  descripcion: string;
  severidad: NivelNotificacion;
  destino: 2 | 3 | 5;
  accion: string;
}
export interface DatosNotificaciones {
  perfil: { sueldo?: unknown } | null;
  gastos: ReadonlyArray<Pick<GastoResumen, "monto" | "categoria">>;
  categorias: ReadonlyArray<CategoriaResumen>;
}

const pesos: Record<NivelNotificacion, number> = {
  critica: 0,
  aviso: 1,
  logro: 2,
};
const dinero = (monto: number) => `$${monto.toLocaleString("es-CL")}`;
const porcentaje = (valor: number) => `${Number(valor.toFixed(1))} %`;

function diaCalendarioLocal(fecha: Date): number | null {
  if (!Number.isFinite(fecha.getTime())) return null;
  return (
    Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) / 86400000
  );
}

function diaDeFecha(fecha: string | null): number | null {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (anio < 1000 || anio > 9999) return null;
  const comprobacion = new Date(anio, mes - 1, dia, 12);
  if (
    comprobacion.getFullYear() !== anio ||
    comprobacion.getMonth() !== mes - 1 ||
    comprobacion.getDate() !== dia
  )
    return null;
  return Date.UTC(anio, mes - 1, dia) / 86400000;
}

/** Alertas activas: se vuelven a calcular cuando cambian los datos, sin historial ficticio. */
export function generarNotificaciones(
  datos: DatosNotificaciones | null,
  metas: ReadonlyArray<MetaAhorro>,
  ahora = new Date(),
): NotificacionFinzen[] {
  const alertas = new Map<string, NotificacionFinzen>();
  const agregar = (alerta: NotificacionFinzen) =>
    alertas.set(alerta.id, alerta);
  if (datos) {
    const resumen = resumirGastos(datos.gastos);
    const sueldo = Number(datos.perfil?.sueldo);
    if (
      Number.isFinite(sueldo) &&
      sueldo > 0 &&
      Number.isFinite(resumen.total)
    ) {
      const saldo = sueldo - Math.max(0, resumen.total);
      const restante = (saldo / sueldo) * 100;
      if (saldo < 0)
        agregar({
          id: "presupuesto",
          severidad: "critica",
          titulo: "Presupuesto excedido",
          descripcion: `Tus gastos superan el sueldo configurado por ${dinero(-saldo)}.`,
          destino: 2,
          accion: "Ver presupuesto",
        });
      else if (saldo === 0)
        agregar({
          id: "presupuesto",
          severidad: "critica",
          titulo: "Presupuesto agotado",
          descripcion: "Ya utilizaste todo el sueldo configurado en Inicio.",
          destino: 2,
          accion: "Ver presupuesto",
        });
      else if (restante <= 20)
        agregar({
          id: "presupuesto",
          severidad: "critica",
          titulo: "Presupuesto en estado crítico",
          descripcion: `Quedan ${dinero(saldo)} (${porcentaje(restante)} del sueldo configurado).`,
          destino: 2,
          accion: "Ver presupuesto",
        });
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
    for (const categoria of datos.categorias) {
      const limite = Number(categoria.limite),
        gastado = resumen.gastoCategoria(categoria.nombre);
      if (!Number.isFinite(limite) || limite <= 0 || !Number.isFinite(gastado))
        continue;
      const usado = (gastado / limite) * 100;
      if (usado >= 100)
        agregar({
          id: `categoria:${categoria.id}`,
          severidad: "critica",
          titulo: `${gastado > limite ? "Límite excedido" : "Límite alcanzado"}: ${categoria.nombre}`,
          descripcion: `Llevas ${dinero(gastado)} de ${dinero(limite)} (${porcentaje(usado)}).`,
          destino: 3,
          accion: "Ver categorías",
        });
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
  for (const meta of metas) {
    const objetivo = Number(meta.monto_objetivo),
      ahorrado = Number(meta.monto_ahorrado);
    if (
      !Number.isFinite(objetivo) ||
      objetivo <= 0 ||
      !Number.isFinite(ahorrado) ||
      ahorrado < 0
    )
      continue;
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
    if (fecha === null || hoy === null) continue;
    const dias = fecha - hoy,
      faltante = dinero(objetivo - ahorrado);
    if (dias < 0)
      agregar({
        id: `meta:${meta.id}`,
        severidad: "critica",
        titulo: `Fecha vencida: ${meta.nombre}`,
        descripcion: `La fecha objetivo ya pasó. Faltan ${faltante} para completar la meta.`,
        destino: 5,
        accion: "Ver metas",
      });
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
  return [...alertas.values()].sort(
    (a, b) =>
      pesos[a.severidad] - pesos[b.severidad] || a.id.localeCompare(b.id),
  );
}
