export type RutasFinzen = {
  Inicio: undefined;
  Categorias: undefined;
  Gasto: undefined;
  Metas: undefined;
  Perfil: undefined;
  Notificaciones: undefined;
  GastosFijos: undefined;
};

export const rutasAnteriores: Record<number, keyof RutasFinzen | undefined> = {
  2: "Inicio",
  3: "Categorias",
  4: "Gasto",
  5: "Metas",
  6: "Notificaciones",
  7: "GastosFijos",
  8: "Perfil",
};

export const pestanasVisibles: ReadonlyArray<{
  name: keyof RutasFinzen;
  label: string;
  icon: "home" | "grid" | "plus" | "target" | "user";
}> = [
  { name: "Inicio", label: "Inicio", icon: "home" },
  { name: "Categorias", label: "Categorías", icon: "grid" },
  { name: "Gasto", label: "Gasto", icon: "plus" },
  { name: "Metas", label: "Metas", icon: "target" },
  { name: "Perfil", label: "Perfil", icon: "user" },
];
