// src/components/SpendingBarChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLOR_PALETTE = ['#D66853', '#E59866', '#D4AC0D', '#58D68D', '#5DADE2', '#AF7AC5', '#AAB7B8'];

export default function SpendingBarChart({ transacciones = [] }) {
  // Filtrar solo egresos y agrupar por categoría
  const egresos = transacciones.filter(t => t.tipo === 'egreso');
  
  const groupedData = egresos.reduce((acc, curr) => {
    const cat = curr.categoria || 'Sin Categoría';
    const monto = parseFloat(curr.monto) || 0;
    acc[cat] = (acc[cat] || 0) + monto;
    return acc;
  }, {});

  const data = Object.keys(groupedData).map((cat) => ({
    categoria: cat,
    total: groupedData[cat]
  })).sort((a, b) => b.total - a.total);

  if (data.length === 0) {
    return (
      <div className="bg-[#F9F6F0] p-6 rounded-2xl border border-[#E5DEC9] text-center text-[#8A7975]">
        <p className="text-sm">No hay registros de gastos para graficar aún.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-[#E5DEC9] shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-[#2C2623] uppercase tracking-wide">
        Gastos por Categoría
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
            <XAxis
              dataKey="categoria"
              tick={{ fill: '#4A3E3D', fontSize: 11 }}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis tick={{ fill: '#4A3E3D', fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Total Gastado']}
              contentStyle={{ backgroundColor: '#FAF6F0', borderRadius: '12px', borderColor: '#D8C4A0' }}
            />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}