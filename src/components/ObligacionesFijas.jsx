import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle2, Circle, AlertCircle, Plus } from 'lucide-react';

export default function ObligacionesFijas({ obligaciones, alActualizar }) {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [diaLimite, setDiaLimite] = useState('');

  const agregarObligacion = async (e) => {
    e.preventDefault();
    if (!descripcion || !monto || !diaLimite) return;

    await supabase.from('obligaciones_fijas').insert([
      {
        descripcion,
        monto_estimado: parseFloat(monto),
        dia_pago_limite: parseInt(diaLimite, 10),
        pagado: false,
        cuenta_id: 'd3b07384-d113-42e8-89c0-fdb692b1f8e4'
      }
    ]);

    setDescripcion('');
    setMonto('');
    setDiaLimite('');
    alActualizar();
  };

  const cambiarEstadoPago = async (obligacion) => {
    const nuevoEstado = !obligacion.pagado;

    // 1. Actualizar el estado de la obligación
    await supabase
      .from('obligaciones_fijas')
      .update({ pagado: nuevoEstado })
      .eq('id', obligacion.id);

    // 2. Si se marca como PAGADO, registrar automáticamente como egreso en transacciones
    if (nuevoEstado) {
      await supabase.from('transacciones').insert([
        {
          monto: obligacion.monto_estimado,
          tipo: 'egreso',
          categoria: obligacion.categoria || 'Obligatorio',
          descripcion: `Pago: ${obligacion.descripcion}`,
          es_obligatorio: true,
          cuenta_id: 'd3b07384-d113-42e8-89c0-fdb692b1f8e4'
        }
      ]);
    }

    alActualizar();
  };

  const totalPendiente = obligaciones
    .filter(o => !o.pagado)
    .reduce((acc, o) => acc + Number(o.monto_estimado), 0);

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-stone-200/80 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-800" /> Obligaciones Fijas
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-orange-100/70 text-orange-950 rounded-full border border-orange-200">
            Pendiente: ${totalPendiente.toLocaleString('es-CO')}
          </span>
        </div>

        {/* Formulario rápido */}
        <form onSubmit={agregarObligacion} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
          <input
            type="text"
            placeholder="Concepto (ej. Arriendo)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="bg-[#FBF9F5] border border-stone-300 text-stone-900 p-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-800"
          />
          <input
            type="number"
            placeholder="Monto ($)"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="bg-[#FBF9F5] border border-stone-300 text-stone-900 p-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-800"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Día límite (1-31)"
              min="1"
              max="31"
              value={diaLimite}
              onChange={(e) => setDiaLimite(e.target.value)}
              className="bg-[#FBF9F5] border border-stone-300 text-stone-900 p-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-800 w-full"
            />
            <button
              type="submit"
              className="bg-orange-900 hover:bg-orange-950 text-white p-2.5 rounded-xl transition text-xs font-semibold flex items-center justify-center shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Lista de obligaciones */}
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {obligaciones.length === 0 ? (
            <p className="text-xs text-stone-400 italic text-center py-4">No hay obligaciones registradas este mes.</p>
          ) : (
            obligaciones.map((o) => (
              <div
                key={o.id}
                onClick={() => cambiarEstadoPago(o)}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                  o.pagado
                    ? 'bg-stone-50 border-stone-200 opacity-60'
                    : 'bg-[#FBF9F5] border-stone-200/90 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {o.pagado ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-400 shrink-0" />
                  )}
                  <div>
                    <p className={`text-xs font-bold ${o.pagado ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                      {o.descripcion}
                    </p>
                    <p className="text-[10px] text-stone-500 font-medium">Vence el día {o.dia_pago_limite} de cada mes</p>
                  </div>
                </div>
                <span className={`text-xs font-extrabold ${o.pagado ? 'text-stone-400' : 'text-orange-950'}`}>
                  ${Number(o.monto_estimado).toLocaleString('es-CO')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}