export interface MetaBase {
  monto_objetivo: number;
  monto_ahorrado: number;
}

export function fechaLocalISO(fecha = new Date()): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

export function fechaLocalValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [year, month, day] = valor.split("-").map(Number);
  if (year < 1900 || year > 9999) return false;
  const fecha = new Date(year, month - 1, day);
  return (
    fecha.getFullYear() === year &&
    fecha.getMonth() === month - 1 &&
    fecha.getDate() === day
  );
}

export function diasHastaFecha(valor: string, hoy = new Date()): number | null {
  if (!fechaLocalValida(valor)) return null;
  const [year, month, day] = valor.split("-").map(Number);
  return Math.round(
    (Date.UTC(year, month - 1, day) -
      Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) /
      86400000,
  );
}

export function porcentajeMeta(meta: MetaBase): number {
  if (
    !Number.isFinite(meta.monto_objetivo) ||
    meta.monto_objetivo <= 0 ||
    !Number.isFinite(meta.monto_ahorrado)
  )
    return 0;
  return Math.min(
    100,
    Math.max(0, Math.floor((meta.monto_ahorrado / meta.monto_objetivo) * 100)),
  );
}

export function leerMontoMeta(valor: string): number {
  let texto = valor.trim().replace(/\s/g, "");
  if (!texto || !/^[0-9.,]+$/.test(texto)) return NaN;
  if (texto.includes(",")) {
    if (!/^\d+(?:\.\d{3})*(?:,\d{1,2})?$/.test(texto)) return NaN;
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(texto))
    texto = texto.replace(/\./g, "");
  else if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) return NaN;
  const monto = Number(texto);
  return Number.isFinite(monto) && monto <= 999999999999.99 ? monto : NaN;
}
