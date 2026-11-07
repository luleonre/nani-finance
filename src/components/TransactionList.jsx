// src/components/TransactionList.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function TransactionList({ transacciones = [], onTransactionUpdated }) {
  const [filter, setFilter] = useState('todos'); // 'todos' | 'ingreso' | 'egreso'
  const [editingItem, setEditingItem] = useState(null);

  const filtered = transacciones.filter(t => filter === 'todos' ? true : t.tipo === filter);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const { id, monto, descripcion, categoria, tipo } = editingItem;

    const { error } = await supabase
      .from('transacciones')
      .update({ monto: parseFloat(monto), descripcion, categoria, tipo })
      .eq('id', id);

    if (!error) {
      setEditingItem(null);
      if (onTransactionUpdated) onTransactionUpdated();
    } else {
      alert('Error al actualizar la transacción: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Deseas eliminar este registro?')) return;
    const { error } = await supabase.from('transacciones').delete().eq('id', id);
    if (!error && onTransactionUpdated) onTransactionUpdated();
  };

  return (
    <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-[#E5DEC9] space-y-4">
      {/* Selector de Filtro */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#2C2623] uppercase tracking-wide">
          Historial de Movimientos
        </h3>
        <div className="flex gap-1 bg-[#E8DCC4] p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('todos')}
            className={`px-2.5 py-1 rounded-lg ${filter === 'todos' ? 'bg-[#2C2623] text-white' : 'text-[#5C4D4A]'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('ingreso')}
            className={`px-2.5 py-1 rounded-lg ${filter === 'ingreso' ? 'bg-[#2E7D32] text-white' : 'text-[#5C4D4A]'}`}
          >
            Ingresos
          </button>
          <button
            onClick={() => setFilter('egreso')}
            className={`px-2.5 py-1 rounded-lg ${filter === 'egreso' ? 'bg-[#D66853] text-white' : 'text-[#5C4D4A]'}`}
          >
            Egresos
          </button>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-center text-[#8A7975] py-4">No hay movimientos registrados en esta categoría.</p>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E5DEC9] shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${
                    item.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-[#D66853]'
                  }`}>
                    {item.categoria || item.tipo}
                  </span>
                  <span className="text-xs text-[#8A7975]">
                    {new Date(item.created_at || item.fecha).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#2C2623] mt-0.5">{item.descripcion || 'Sin descripción'}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${item.tipo === 'ingreso' ? 'text-[#2E7D32]' : 'text-[#D66853]'}`}>
                  {item.tipo === 'ingreso' ? '+' : '-'}${Number(item.monto).toLocaleString()}
                </span>
                
                {/* Botón Editar */}
                <button
                  onClick={() => setEditingItem(item)}
                  className="p-1.5 text-gray-500 hover:text-[#2C2623] hover:bg-gray-100 rounded-lg transition"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Edición */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveEdit} className="bg-[#FAF6F0] p-5 rounded-2xl border border-[#D8C4A0] max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-[#2C2623]">Editar Registro</h4>
            
            <div>
              <label className="block text-xs font-semibold text-[#5C4D4A] mb-1">Monto ($)</label>
              <input
                type="number"
                step="0.01"
                value={editingItem.monto}
                onChange={(e) => setEditingItem({ ...editingItem, monto: e.target.value })}
                className="w-full p-2 bg-white border rounded-xl text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4D4A] mb-1">Descripción</label>
              <input
                type="text"
                value={editingItem.descripcion}
                onChange={(e) => setEditingItem({ ...editingItem, descripcion: e.target.value })}
                className="w-full p-2 bg-white border rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C4D4A] mb-1">Categoría</label>
              <input
                type="text"
                value={editingItem.categoria}
                onChange={(e) => setEditingItem({ ...editingItem, categoria: e.target.value })}
                className="w-full p-2 bg-white border rounded-xl text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-1/2 py-2 bg-gray-200 text-[#4A3E3D] rounded-xl text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 bg-[#D66853] text-white rounded-xl text-sm font-semibold"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}