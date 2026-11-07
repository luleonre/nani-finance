import React from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

export default function ExportarExcel({ transacciones }) {
  const descargarExcel = () => {
    const datosProcesados = transacciones.map((t) => ({
      Fecha: new Date(t.fecha).toLocaleDateString(),
      Tipo: t.tipo.toUpperCase(),
      Categoría: t.categoria,
      Monto: t.monto,
      Obligatorio: t.es_obligatorio ? 'Sí' : 'No'
    }));

    const hoja = XLSX.utils.json_to_sheet(datosProcesados);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Movimientos');

    XLSX.writeFile(libro, `Reporte_Financiero_${new Date().toISOString().slice(0, 7)}.xlsx`);
  };

  return (
    <button
      onClick={descargarExcel}
      className="flex items-center gap-2 bg-white hover:bg-[#FBF9F5] text-stone-700 text-sm font-semibold px-4 py-2.5 rounded-2xl border border-stone-300 shadow-sm transition active:scale-95"
    >
      <Download className="w-4 h-4 text-orange-800" /> Exportar Excel
    </button>
  );
}