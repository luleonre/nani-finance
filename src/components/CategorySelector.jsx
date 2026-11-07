// src/components/CategorySelector.jsx
import React, { useState, useEffect } from 'react';

const DEFAULT_CATEGORIES = {
  ingreso: ['Nómina', 'Ventas', 'Transferencia', 'Regalo', 'Otros'],
  egreso: ['Alimentación', 'Arriendo', 'Servicios', 'Transporte', 'Entretenimiento', 'Salud', 'Otros']
};

export default function CategorySelector({ tipo, value, onChange }) {
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('nani_custom_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [newCat, setNewCat] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem('nani_custom_categories', JSON.stringify(categories));
  }, [categories]);

  const handleAddCategory = () => {
    if (!newCat.trim()) return;
    const catName = newCat.trim();
    if (!categories[tipo].includes(catName)) {
      setCategories(prev => ({
        ...prev,
        [tipo]: [...prev[tipo], catName]
      }));
    }
    onChange(catName);
    setNewCat('');
    setIsAdding(false);
  };

  const handleRemoveCategory = (catToRemove) => {
    setCategories(prev => ({
      ...prev,
      [tipo]: prev[tipo].filter(c => c !== catToRemove)
    }));
    if (value === catToRemove) onChange('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#4A3E3D]">Categoría</label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2.5 bg-white border border-[#D8C4A0] rounded-xl text-[#2C2623] focus:ring-2 focus:ring-[#D66853] outline-none"
        >
          <option value="">-- Seleccionar Categoría --</option>
          {categories[tipo]?.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-2 bg-[#D66853] text-white rounded-xl font-bold hover:bg-[#B8523E] transition"
          title="Agregar/Administrar Categoría"
        >
          +
        </button>
      </div>

      {isAdding && (
        <div className="p-3 bg-[#F3EDE2] border border-[#D8C4A0] rounded-xl space-y-3">
          <p className="text-xs font-semibold text-[#6B5B57]">Agregar nueva categoría para {tipo}:</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: Mascotas"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="w-full p-2 bg-white border border-[#D8C4A0] rounded-lg text-sm"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-3 py-1.5 bg-[#2C2623] text-white rounded-lg text-xs font-semibold"
            >
              Guardar
            </button>
          </div>

          <div className="pt-2">
            <p className="text-xs text-[#8A7975] mb-1">Eliminar categorías personalizadas:</p>
            <div className="flex flex-wrap gap-1.5">
              {categories[tipo].map((cat) => (
                <span key={cat} className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border text-xs">
                  {cat}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-red-500 font-bold hover:text-red-700 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}