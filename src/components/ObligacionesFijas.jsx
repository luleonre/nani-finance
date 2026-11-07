import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle2, Circle, Plus, Trash2, Calendar } from 'lucide-react';

const CUENTA_ID_DEFAULT = 'd3b07384-d113-42e8-89c0-fdb692b1f8e4';

export default function ObligacionesFijas({ obligaciones = [], alActualizar }) {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [diaLimite, setDiaLimite] = useState('');
  const [mostrandoForm, setMostrandoForm] = useState(false);

  const handleMontoChange = (e) => {
    const soloNumeros = e.target.value.replace(/\D/g, '');
    if (!soloNumeros) {
      setNuevoMonto('');
      return;
    }
    setNuevoMonto(Number(soloNumeros).toLocaleString('es-CO'));
  };

  const agregarObligacion = async (e) => {
    e.preventDefault();
    const montoLimpio = parseFloat(nuevoMonto.replace(/\./g, '').replace(/,/g, ''));

    if (!nuevoNombre.trim() || isNaN(montoLimpio) || montoLimpio <= 0) {
      alert('Por favor ingresa un nombre y un monto válido.');
      return;
    }

    const { error } = await supabase.from('obligaciones_fijas').insert([
      {
        descripcion: nuevoNombre.trim(),
        monto_estimado: montoLimpio,
        dia_pago_limite: diaLimite ? parseInt(diaLimite) : 1,
        pagado: false
      }
    ]);

    if (error) {
      alert('Error al guardar en Supabase: ' + error.message);
    } else {
      setNuevoNombre('');
      setNuevoMonto('');
      setDiaLimite('');
      setMostrandoForm(false);
      if (alActualizar) await alActualizar();
    }
  };

  const togglePagado = async (o) => {
    const nuevoEstado = !o.pagado;

    // 1. Actualizar estado pagado en la tabla obligaciones_fijas
    const { error: errorOblig } = await supabase
      .from('obligaciones_fijas')
      .update({ pagado: nuevoEstado })
      .eq('id', o.id);

    if (errorOblig) {
      alert('Error al actualizar la obligación: ' + errorOblig.message);
      return;
    }

    // 2. Si se marca como PAGADA, registrar en la tabla transacciones para sumar a Egresos e Historial
    if (nuevoEstado) {
      const payload = {
        monto: parseFloat(o.monto_estimado),
        tipo: 'egreso', // Se guarda como 'egreso' para cumplir restricciones SQL de Supabase
        categoria: 'Obligación Fija',
        descripcion: o.descripcion ? `Pago: ${o.descripcion}` : 'Pago de obligación fija',
        cuenta_id: CUENTA_ID_DEFAULT,
        fecha: new Date().toISOString()
      };

      const { error: errorTrans } = await supabase.from('transacciones').insert([payload]);

      if (errorTrans) {
        alert('Error registrando en el historial: ' + errorTrans.message);
        // Revertir el estado si falla la transacción
        await supabase.from('obligaciones_fijas').update({ pagado: false }).eq('id', o.id);
        return;
      }
    }

    if (alActualizar) await alActualizar();
  };

  const eliminarObligacion = async (id) => {
    if (!window.confirm('¿Deseas eliminar esta obligación fija?')) return;
    const { error } = await supabase.from('obligaciones_fijas').delete().eq('id', id);
    if (!error && alActualizar) {
      await alActualizar();
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-stone-200/80 p-6 rounded-3xl shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Obligaciones Fijas</h2>
          <p className="text-xs text-stone-500">Gastos mensuales recurribles</p>
        </div>
        <button
          onClick={() => setMostrandoForm(!mostrandoForm)}
          className="bg-orange-900 hover:bg-orange-950 text-white text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Nueva Obligación
        </button>
      </div>

      {mostrandoForm && (
        <form onSubmit={agregarObligacion} className="p-4 bg-[#FBF9F5] border border-stone-200 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-stone-700">Agregar Obligación Fija</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Ej: Arriendo, Internet"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="p-2.5 bg-white border border-stone-300 rounded-xl text-xs"
              required
            />
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">$</span>
              <input
                type="text"
                placeholder="Monto ($)"
                value={nuevoMonto}
                onChange={handleMontoChange}
                className="w-full pl-7 pr-2.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium"
                required
              />
            </div>
            <input
              type="number"
              placeholder="Día límite de pago (1-31)"
              min="1"
              max="31"
              value={diaLimite}
              onChange={(e) => setDiaLimite(e.target.value)}
              className="p-2.5 bg-white border border-stone-300 rounded-xl text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMostrandoForm(false)}
              className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-orange-900 text-white text-xs rounded-xl font-semibold"
            >
              Guardar Obligación
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {obligaciones.length === 0 ? (
          <p className="text-xs text-center text-stone-400 py-4">No hay obligaciones fijas registradas aún.</p>
        ) : (
          obligaciones.map((o) => (
            <div
              key={o.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                o.pagado ? 'bg-stone-50 border-stone-200 opacity-60' : 'bg-[#FBF9F5] border-stone-300/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => togglePagado(o)}
                  className="text-stone-400 hover:text-emerald-700 transition"
                  title={o.pagado ? "Marcar como pendiente" : "Marcar como pagado"}
                >
                  {o.pagado ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-400" />
                  )}
                </button>
                <div>
                  <p className={`text-sm font-semibold ${o.pagado ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                    {o.descripcion || 'Sin descripción'}
                  </p>
                  {o.dia_pago_limite && (
                    <p className="text-[11px] text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Día límite: {o.dia_pago_limite}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${o.pagado ? 'text-stone-400' : 'text-orange-950'}`}>
                  ${Number(o.monto_estimado).toLocaleString('es-CO')}
                </span>
                <button
                  onClick={() => eliminarObligacion(o.id)}
                  className="p-1 text-stone-400 hover:text-red-600 transition"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}