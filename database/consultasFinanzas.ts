import { supabase } from "./supabase";

export interface GastoResumen {
  id: number | string;
  monto: number | string;
  categoria: string;
  icono: string | null;
}
export interface CategoriaResumen {
  id: number | string;
  nombre: string;
  icono: string | null;
  limite: number | string;
  color: string | null;
}

export function resumirGastos(
  gastos: ReadonlyArray<Pick<GastoResumen, "monto" | "categoria">>,
) {
  let total = 0;
  const porCategoria = new Map<string, number>();
  for (const gasto of gastos) {
    const monto = Number(gasto.monto);
    if (!Number.isFinite(monto)) continue;
    total += monto;
    porCategoria.set(
      gasto.categoria,
      (porCategoria.get(gasto.categoria) || 0) + monto,
    );
  }
  // Compatibilidad con registros antiguos llamados Comida.
  const gastoCategoria = (nombre: string) =>
    (porCategoria.get(nombre) || 0) +
    (nombre === "Alimentación" ? porCategoria.get("Comida") || 0 : 0);
  return { total, gastoCategoria };
}

async function usuarioActual() {
  // La sesión local evita validar el usuario por red en cada lectura.
  // Supabase sigue autorizando cada consulta con su token y sus políticas.
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.user) throw new Error("No hay una sesión activa.");
  return session.user;
}

export async function consultarInicio() {
  const user = await usuarioActual();
  const [perfil, gastos, categorias] = await Promise.all([
    supabase
      .from("perfiles")
      .select("nombre, sueldo")
      .eq("id", user.id)
      .single(),
    supabase
      .from("gastos")
      .select("id, monto, categoria, icono")
      .eq("usuario_id", user.id)
      .order("id", { ascending: false }),
    supabase
      .from("categorias")
      .select("id, nombre, icono, limite, color")
      .eq("usuario_id", user.id)
      .order("id", { ascending: true }),
  ]);
  if (perfil.error) throw perfil.error;
  if (gastos.error) throw gastos.error;
  if (categorias.error) throw categorias.error;
  return {
    user,
    perfil: perfil.data,
    gastos: (gastos.data || []) as GastoResumen[],
    categorias: (categorias.data || []) as CategoriaResumen[],
  };
}

export async function consultarCategorias() {
  const user = await usuarioActual();
  const [categorias, gastos] = await Promise.all([
    supabase
      .from("categorias")
      .select("id, nombre, icono, limite, color")
      .eq("usuario_id", user.id)
      .order("id", { ascending: true }),
    supabase
      .from("gastos")
      .select("monto, categoria")
      .eq("usuario_id", user.id),
  ]);
  if (categorias.error) throw categorias.error;
  if (gastos.error) throw gastos.error;
  return {
    categorias: (categorias.data || []) as CategoriaResumen[],
    gastos: (gastos.data || []) as Pick<GastoResumen, "monto" | "categoria">[],
  };
}
