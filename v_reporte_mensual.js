import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';

export const exportarReporteMensual = async (userId, anio, mes) => {
  // 1. Consultar transacciones detalladas del mes seleccionado
  const { data: transacciones, error } = await supabase
    .from('transacciones')
    .select(`
      fecha,
      tipo,
      categoria,
      descripcion,
      monto,
      es_obligatorio,
      cuentas (nombre)
    `)
    .eq('user_id', userId)
    .gte('fecha', `${anio}-${mes}-01`)
    .lte('fecha', `${anio}-${mes}-31`);

  if (error) return console.error(error);

  // 2. Formatear datos para las columnas de Excel
  const datosExcel = transacciones.map(t => ({
    Fecha: new Date(t.fecha).toLocaleDateString(),
    Cuenta: t.cuentas?.nombre,
    Tipo: t.tipo.toUpperCase(),
    Categoría: t.categoria,
    Descripción: t.descripcion || '',
    Monto: t.monto,
    '¿Obligatorio?': t.es_obligatorio ? 'Sí' : 'No'
  }));

  // 3. Crear el libro y la hoja de cálculo
  const hoja = XLSX.utils.json_to_sheet(datosExcel);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, `Mes_${mes}_${anio}`);

  // 4. Descargar archivo
  XLSX.writeFile(libro, `Reporte_Financiero_Nani_${anio}_${mes}.xlsx`);
};