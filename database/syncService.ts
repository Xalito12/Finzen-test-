import { db } from './db';
import { supabase } from './supabase';

export const respaldarEnLaNube = async () => {
  // Esta validación elimina el error de TypeScript
  if (!db) return; 

  try {
    const categoriasLocales = db.getAllSync('SELECT * FROM categorias;');
    const gastosLocales = db.getAllSync('SELECT * FROM gastos;');

    if (categoriasLocales.length > 0) {
      const { error } = await supabase.from('categorias').upsert(categoriasLocales);
      if (error) throw error;
    }

    if (gastosLocales.length > 0) {
      const { error } = await supabase.from('gastos').upsert(gastosLocales);
      if (error) throw error;
    }

  } catch (error) {
    console.error("Error al respaldar:", error);
  }
};