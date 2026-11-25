// Define las pantallas disponibles para la navegación.
// undefined indica que estas rutas no reciben parámetros.
export type RutasFinzen = {
  Inicio: undefined;
  Categorias: undefined;
  Gasto: undefined;
  Metas: undefined;
  Perfil: undefined;
  Notificaciones: undefined;
  GastosFijos: undefined;
};

// Relaciona los números utilizados en los callbacks onNav con las rutas.
// Por ejemplo, onNav(2) corresponde a la pantalla Inicio.
export const rutasAnteriores: Record<number, keyof RutasFinzen | undefined> = {
  2: "Inicio",
  3: "Categorias",
  4: "Gasto",
  5: "Metas",
  6: "Notificaciones",
  7: "GastosFijos",
  8: "Perfil",
};

// Define las pestañas que aparecen en la barra inferior y su orden.
// Notificaciones y GastosFijos se abren desde otros accesos de la aplicación.
export const pestanasVisibles: ReadonlyArray<{
  // Nombre de la ruta que se abrirá al pulsar la pestaña.
  name: keyof RutasFinzen;

  // Texto que se muestra debajo del icono.
  label: string;

  // Nombres de los iconos permitidos para las pestañas.
  icon: "home" | "grid" | "plus" | "target" | "user";
}> = [
  { name: "Inicio", label: "Inicio", icon: "home" },
  { name: "Categorias", label: "Categorías", icon: "grid" },
  { name: "Gasto", label: "Gasto", icon: "plus" },
  { name: "Metas", label: "Metas", icon: "target" },
  { name: "Perfil", label: "Perfil", icon: "user" },
];
