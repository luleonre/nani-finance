import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

// Paleta de colores cálidos y elegantes (Naranjas, terracota, dorados y tonos neutros)
const COLORES = [
  '#7C2D12', // Terracota Oscuro
  '#C2410C', // Naranja Quemado
  '#EA580C', // Naranja Vibrante
  '#D97706', // Ámbar
  '#CA8A04', // Dorado
  '#78350F', // Café Cálido
  '#A16207', // Ocre
  '#57534E', // Piedra Oscuro
];

export default function GraficaEgresos({ transacciones }) {
  // 1. Filtrar solo egresos y agrupar la suma por categoría
  const egresos = transacciones.filter(t => t.tipo === 'egreso');

  const datosAgrupados = egresos.reduce((acc, t) => {
    const cat = t.categoria || 'Otros';
    acc[cat] = (acc[cat] || 0) + Number(t.monto);
    return acc;
  }, {});

  const data = Object.keys(datosAgrupados).map(categoria => ({
    name: categoria,
    value: datosAgrupados[categoria]
  }));

  // Tooltip personalizado con formato de moneda en pesos colombianos
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-stone-200 p-3 rounded-2xl shadow-md text-xs">
          <p className="font-bold text-stone-800 mb-0.5">{payload[0].name}</p>
          <p className="text-orange-950 font-extrabold">
            ${Number(payload[0].value).toLocaleString('es-CO')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-stone-200/80 p-6 rounded-3xl shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-orange-100/70 rounded-xl border border-orange-200/50">
            <PieIcon className="w-5 h-5 text-orange-900" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">Distribución de Gastos</h2>
        </div>

        {data.length === 0 ? (
          <div className="flex items-center justify-center h-52 text-xs text-stone-400 italic">
            No hay egresos registrados para graficar.
          </div>
        ) : (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="transparent"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORES[index % COLORES.length]} 
                      className="transition-opacity hover:opacity-85"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-xs font-medium text-stone-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}