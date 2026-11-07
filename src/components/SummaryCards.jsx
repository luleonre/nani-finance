// src/components/SummaryCards.jsx
import React from 'react';

export default function SummaryCards({ transacciones = [] }) {
  const totalIngresos = transacciones
    .filter(t => t.tipo === 'ingreso')
    .reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);

  const totalEgresos = transacciones
    .filter(t => t.tipo === 'egreso')
    .reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);

  const disponible = totalIngresos - totalEgresos;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-[#EAF5EA] p-3 rounded-2xl border border-[#C8E6C9]">
        <p className="text-[11px] font-bold text-[#2E7D32] uppercase">Ingresos</p>
        <p className="text-base font-extrabold text-[#1B5E20] mt-1">
          +${totalIngresos.toLocaleString()}
        </p>
      </div>

      <div className="bg-[#FDF2E9] p-3 rounded-2xl border border-[#FADBD8]">
        <p className="text-[11px] font-bold text-[#D66853] uppercase">Gastos</p>
        <p className="text-base font-extrabold text-[#B8523E] mt-1">
          -${totalEgresos.toLocaleString()}
        </p>
      </div>

      <div className="bg-[#FAF6F0] p-3 rounded-2xl border border-[#D8C4A0]">
        <p className="text-[11px] font-bold text-[#2C2623] uppercase">Disponible</p>
        <p className="text-base font-extrabold text-[#2C2623] mt-1">
          ${disponible.toLocaleString()}
        </p>
      </div>
    </div>
  );
}