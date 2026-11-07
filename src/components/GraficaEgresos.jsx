import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PALETA_COLORES = ['#9A3412', '#C2410C', '#EA580C', '#F97316', '#FB923C', '#FDBA74', '#78350F'];

export default function GraficaEgresos({ transacciones = [] }) {
  // Filtrar solo egresos y agrupar por categoría
  const egresos = transacciones.filter((t) => t.tipo === 'egreso');

  const agrupado = egresos.reduce((acc, curr) => {
    const cat = curr.categoria || 'Sin Categoría';
    const monto = parseFloat(curr.monto) || 0;
    acc[cat] = (acc[cat] || 0) + monto;
    return acc;
  }, {});

  const data = Object.keys(agrupado)
    .map((cat) => ({
      categoria: cat,
      total: agrupado[cat],
    }))
    .sort((a, b) => b.total - a.total);

  // Formato para la escala del eje Y (en miles)
  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `$${(value / 1000).toLocaleString('es-CO')}k`;
    }
    return `$${value}`;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm border border-stone-200/80 p-6 rounded-3xl shadow-sm text-center text-stone-500 h-full flex flex-col justify-center items-center min-h-[260px]">
        <p className="text-sm">No hay registros de gastos para graficar aún.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-stone-200/80 p-6 rounded-3xl shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-stone-900">Distribución de Gastos</h3>
        <span className="text-xs text-stone-400 font-medium">Por categoría</span>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
            <XAxis
              dataKey="categoria"
              tick={{ fill: '#57534E', fontSize: 11 }}
              interval={0}
              angle={-25}
              textAnchor="end"
            />
            <YAxis 
              tick={{ fill: '#57534E', fontSize: 11 }} 
              tickFormatter={formatYAxis}
            />
            <Tooltip
              formatter={(value) => [`$${Number(value).toLocaleString('es-CO')}`, 'Total Gastado']}
              contentStyle={{ backgroundColor: '#F6F3EC', borderRadius: '16px', borderColor: '#E7E5E4' }}
            />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PALETA_COLORES[index % PALETA_COLORES.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}