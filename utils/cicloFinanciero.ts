// utils/cicloFinanciero.ts

export interface CicloFinanciero {
  diaCorte: number;
  inicioISO: string; // "AAAA-MM-DD"
  finISO: string;    // "AAAA-MM-DD"
  etiqueta: string;  // Ej: "5 nov - 4 dic"
}

const MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function normalizarDiaPago(diaPago: unknown): number {
  const n = Number(diaPago);
  if (!Number.isInteger(n) || n < 1 || n > 31) return 1;
  return n;
}

function ultimoDiaDelMes(anio: number, mesCero: number): number {
  return new Date(anio, mesCero + 1, 0).getDate();
}

function fechaDeCorte(anio: number, mesCero: number, diaCorte: number): Date {
  const dia = Math.min(diaCorte, ultimoDiaDelMes(anio, mesCero));
  return new Date(anio, mesCero, dia, 12, 0, 0);
}

export function formatearFechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function fechaHoyISO(): string {
  return formatearFechaISO(new Date());
}

export function esFechaISOValida(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [anio, mes, dia] = texto.split("-").map(Number);
  const prueba = new Date(anio, mes - 1, dia, 12);
  return (
    prueba.getFullYear() === anio &&
    prueba.getMonth() === mes - 1 &&
    prueba.getDate() === dia
  );
}

function textoCorto(fecha: Date): string {
  return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}`;
}

/**
 * Calcula el ciclo financiero para una fecha de referencia.
 * desplazamientoCiclos: 0 = ciclo actual, -1 = ciclo anterior, +1 = siguiente.
 */
export function calcularCicloFinanciero(
  diaPago: unknown,
  referencia = new Date(),
  desplazamientoCiclos = 0,
): CicloFinanciero {
  const diaCorte = normalizarDiaPago(diaPago);
  const anioRef = referencia.getFullYear();
  const mesRef = referencia.getMonth();
  const diaRef = referencia.getDate();

  const corteEsteMes = Math.min(diaCorte, ultimoDiaDelMes(anioRef, mesRef));
  let mesTotalInicio = anioRef * 12 + mesRef;

  if (diaRef < corteEsteMes) {
    mesTotalInicio -= 1;
  }

  mesTotalInicio += desplazamientoCiclos;

  const anioInicio = Math.floor(mesTotalInicio / 12);
  const mesInicio = ((mesTotalInicio % 12) + 12) % 12;

  const mesTotalSiguiente = mesTotalInicio + 1;
  const anioSig = Math.floor(mesTotalSiguiente / 12);
  const mesSig = ((mesTotalSiguiente % 12) + 12) % 12;

  const inicio = fechaDeCorte(anioInicio, mesInicio, diaCorte);
  const siguienteInicio = fechaDeCorte(anioSig, mesSig, diaCorte);
  const fin = new Date(
    siguienteInicio.getFullYear(),
    siguienteInicio.getMonth(),
    siguienteInicio.getDate() - 1,
    12,
    0,
    0,
  );

  return {
    diaCorte,
    inicioISO: formatearFechaISO(inicio),
    finISO: formatearFechaISO(fin),
    etiqueta: `${textoCorto(inicio)} - ${textoCorto(fin)}`,
  };
}