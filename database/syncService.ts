import { db } from './db';
import { supabase } from './supabase';

// Respalda las categorías y los gastos de la base local en Supabase.
// Usa upsert para insertar registros nuevos o actualizar los existentes.
// Si ocurre un error durante el respaldo, lo registra en la consola.
export const respaldarEnLaNube = async () => {
  // Esta validación elimina el error de TypeScript
  // Finaliza la función si la conexión con la base local no está disponible.
  if (!db) return; 

  try {
    const categoriasLocales = db.getAllSync('SELECT * FROM categorias;');
    const gastosLocales = db.getAllSync('SELECT * FROM gastos;');

    // Respalda las categorías cuando la consulta local contiene registros.
    if (categoriasLocales.length > 0) {
      const { error } = await supabase.from('categorias').upsert(categoriasLocales);
      // Si Supabase devuelve un error, lo envía al bloque catch.
      if (error) throw error;
    }

    // Respalda los gastos cuando la consulta local contiene registros.
    if (gastosLocales.length > 0) {
      const { error } = await supabase.from('gastos').upsert(gastosLocales);
      // Si Supabase devuelve un error, lo envía al bloque catch.
      if (error) throw error;
    }

  } catch (error) {
    console.error("Error al respaldar:", error);
  }
};