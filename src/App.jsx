import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import PinAuth from './components/PinAuth';
import ExportarExcel from './components/ExportarExcel';
import ObligacionesFijas from './components/ObligacionesFijas';
import GraficaEgresos from './components/GraficaEgresos';
import { 
  PlusCircle, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Pencil, 
  Trash2, 
  Plus, 
  X,
  Tag,
  AlertTriangle,
  CalendarCheck
} from 'lucide-react';

const CATEGORIAS_DEFECTO = {
  egreso: ['Comida', 'Transporte', 'Arriendo', 'Servicios', 'Entretenimiento', 'Salud', 'Otros'],
  ingreso: ['Nómina', 'Ventas', 'Transferencia', 'Regalo', 'Otros']
};

const CUENTA_ID_DEFAULT = 'd3b07384-d113-42e8-89c0-fdb692b1f8e4';

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [disponibleReal, setDisponibleReal] = useState(0);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalEgresos, setTotalEgresos] = useState(0);
  const [transacciones, setTransacciones] = useState([]);
  const [obligaciones, setObligaciones] = useState([]);

  // Formulario de registro rápido
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('Comida');
  const [tipo, setTipo] = useState('egreso');

  // Categorías personalizables
  const [categorias, setCategorias] = useState(() => {
    const saved = localStorage.getItem('nani_custom_categories');
    return saved ? JSON.parse(saved) : CATEGORIAS_DEFECTO;
  });
  const [mostrandoCrearCategoria, setMostrandoCrearCategoria] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');

  // Filtros y Edición
  const [filtroHistorial, setFiltroHistorial] = useState('todos');
  const [editandoTransaccion, setEditandoTransaccion] = useState(null);

  const obtenerFechaHoy = () => {
    const hoy = new Date();
    const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const str = hoy.toLocaleDateString('es-CO', opciones);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const esFinDeMes = () => {
    const hoy = new Date();
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    return hoy.getDate() === ultimoDia;
  };

  useEffect(() => {
    localStorage.setItem('nani_custom_categories', JSON.stringify(categorias));
  }, [categorias]);

  useEffect(() => {
    if (autenticado) {
      cargarDatos();
    }
  }, [autenticado]);

  useEffect(() => {
    if (categorias[tipo] && categorias[tipo].length > 0) {
      setNuevaCategoria(categorias[tipo][0]);
    }
  }, [tipo]);

  const handleMontoChange = (e) => {
    const soloNumeros = e.target.value.replace(/\D/g, '');
    if (!soloNumeros) {
      setNuevoMonto('');
      return;
    }
    setNuevoMonto(Number(soloNumeros).toLocaleString('es-CO'));
  };

  const cargarDatos = async () => {
    let { data: transData, error: transError } = await supabase
      .from('transacciones')
      .select('*')
      .order('fecha', { ascending: false });

    if (transError) {
      const retry = await supabase
        .from('transacciones')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!retry.error) {
        transData = retry.data;
        transError = null;
      }
    }

    const { data: obligData } = await supabase
      .from('obligaciones_fijas')
      .select('*')
      .order('dia_pago_limite', { ascending: true });

    const currentTrans = transData || [];
    const currentOblig = obligData || [];

    setTransacciones(currentTrans);
    setObligaciones(currentOblig);
    calcularMetricas(currentTrans, currentOblig);
  };

  const calcularMetricas = (transData = [], obligData = []) => {
    const ingresos = transData
      .filter((t) => t.tipo === 'ingreso')
      .reduce((acc, t) => acc + (parseFloat(t.monto) || 0), 0);
      
    const egresos = transData
      .filter((t) => t.tipo === 'egreso' || t.tipo === 'obligacion' || t.categoria === 'Obligación Fija')
      .reduce((acc, t) => acc + (parseFloat(t.monto) || 0), 0);

    const obligacionesPendientes = obligData
      .filter((o) => !o.pagado)
      .reduce((acc, o) => acc + (parseFloat(o.monto_estimado) || 0), 0);

    setTotalIngresos(ingresos);
    setTotalEgresos(egresos);
    setDisponibleReal(ingresos - egresos - obligacionesPendientes);
  };

  const registrarTransaccion = async (e) => {
    e.preventDefault();

    const montoLimpio = parseFloat(nuevoMonto.replace(/\./g, '').replace(/,/g, ''));
    if (isNaN(montoLimpio) || montoLimpio <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    const catFinal = nuevaCategoria || (categorias[tipo] && categorias[tipo][0]) || 'General';

    const payload = {
      monto: montoLimpio,
      tipo: tipo,
      categoria: catFinal,
      cuenta_id: CUENTA_ID_DEFAULT,
      fecha: new Date().toISOString()
    };

    if (nuevaDescripcion && nuevaDescripcion.trim()) {
      payload.descripcion = nuevaDescripcion.trim();
    }

    const { error } = await supabase.from('transacciones').insert([payload]);

    if (error) {
      alert(`Supabase rechazó el guardado: ${error.message}`);
      return;
    }

    setNuevoMonto('');
    setNuevaDescripcion('');
    await cargarDatos();
  };

  const agregarNuevaCategoria = () => {
    if (!nuevaCatNombre.trim()) return;
    const catLimpia = nuevaCatNombre.trim();
    if (!categorias[tipo].includes(catLimpia)) {
      const nuevasCategorias = {
        ...categorias,
        [tipo]: [...categorias[tipo], catLimpia]
      };
      setCategorias(nuevasCategorias);
      setNuevaCategoria(catLimpia);
    }
    setNuevaCatNombre('');
    setMostrandoCrearCategoria(false);
  };

  const eliminarCategoria = (catAEliminar) => {
    const filtradas = categorias[tipo].filter((c) => c !== catAEliminar);
    const nuevasCategorias = { ...categorias, [tipo]: filtradas };
    setCategorias(nuevasCategorias);
    if (nuevaCategoria === catAEliminar && filtradas.length > 0) {
      setNuevaCategoria(filtradas[0]);
    }
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!editandoTransaccion) return;

    const { id, monto, categoria, tipo: tipoEdit, descripcion } = editandoTransaccion;

    const montoLimpio = typeof monto === 'string' 
      ? parseFloat(monto.replace(/\./g, '').replace(/,/g, '')) 
      : parseFloat(monto);

    if (isNaN(montoLimpio) || montoLimpio <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    const { error } = await supabase
      .from('transacciones')
      .update({
        monto: montoLimpio,
        categoria,
        tipo: tipoEdit,
        descripcion: descripcion ? descripcion.trim() : null
      })
      .eq('id', id);

    if (!error) {
      setEditandoTransaccion(null);
      await cargarDatos();
    } else {
      alert('Error actualizando el registro: ' + error.message);
    }
  };

  const eliminarTransaccion = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
    const { error } = await supabase.from('transacciones').delete().eq('id', id);
    if (!error) {
      await cargarDatos();
    }
  };

  if (!autenticado) {
    return <PinAuth onSuccess={() => setAutenticado(true)} />;
  }

  const transaccionesFiltradas = transacciones.filter((t) => {
    if (filtroHistorial === 'todos') return true;
    if (filtroHistorial === 'egreso') return t.tipo === 'egreso' || t.tipo === 'obligacion' || t.categoria === 'Obligación Fija';
    return t.tipo === filtroHistorial;
  });

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-stone-800 p-4 md:p-10 font-sans">
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-stone-300/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-orange-950 uppercase">
            NANI FINANCE
          </h1>
          <p className="text-xs font-semibold text-stone-500 mt-1 flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4 text-orange-900" />
            {obtenerFechaHoy()}
          </p>
        </div>
        <ExportarExcel transacciones={transacciones} />
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        {esFinDeMes() && (
          <div className="bg-amber-50 border border-amber-300 p-4 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-200/80 rounded-2xl text-amber-900">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">¡Hoy es el último día del mes!</h4>
                <p className="text-xs text-amber-800">
                  Te recomendamos exportar tu reporte a Excel para guardar tu historial financiero antes de iniciar el nuevo mes.
                </p>
              </div>
            </div>
            <ExportarExcel transacciones={transacciones} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50/90 border border-emerald-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Ingresos</span>
              <p className="text-2xl font-extrabold text-emerald-950 mt-1">
                +${totalIngresos.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="p-3 bg-emerald-100/80 rounded-2xl text-emerald-700">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-rose-50/90 border border-rose-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Total Egresos</span>
              <p className="text-2xl font-extrabold text-rose-950 mt-1">
                -${totalEgresos.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="p-3 bg-rose-100/80 rounded-2xl text-rose-700">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border border-stone-200/80 p-5 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Disponible Real</span>
              <p className="text-2xl font-extrabold text-orange-950 mt-1">
                ${disponibleReal.toLocaleString('es-CO')}
              </p>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                *Descuenta obligaciones pendientes
              </span>
            </div>
            <div className="p-3 bg-orange-100/70 rounded-2xl border border-orange-200/50 text-orange-900">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm border border-stone-200/80 p-6 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-orange-800" /> Registro Rápido
          </h2>
          
          <form onSubmit={registrarTransaccion} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="bg-[#FBF9F5] border border-stone-300 text-stone-800 p-3 rounded-2xl text-sm font-medium focus:outline-none focus:border-orange-800 transition"
              >
                <option value="egreso">Egreso (Gasto)</option>
                <option value="ingreso">Ingreso (Nómina/Entrada)</option>
              </select>

              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-stone-500 font-bold text-sm">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Monto"
                  value={nuevoMonto}
                  onChange={handleMontoChange}
                  className="w-full pl-8 pr-3 py-3 bg-[#FBF9F5] border border-stone-300 text-stone-900 placeholder:text-stone-400 rounded-2xl focus:outline-none focus:border-orange-800 focus:ring-2 focus:ring-orange-800/15 text-sm font-medium transition"
                  required
                />
              </div>

              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                className="bg-[#FBF9F5] border border-stone-300 text-stone-900 placeholder:text-stone-400 p-3 rounded-2xl focus:outline-none focus:border-orange-800 text-sm font-medium transition"
              />

              <div className="flex gap-1.5">
                <select
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-stone-300 text-stone-800 p-3 rounded-2xl text-sm font-medium focus:outline-none focus:border-orange-800 transition"
                >
                  {categorias[tipo]?.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setMostrandoCrearCategoria(!mostrandoCrearCategoria)}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-700 p-3 rounded-2xl transition"
                  title="Administrar Categorías"
                >
                  <Tag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {mostrandoCrearCategoria && (
              <div className="p-4 bg-[#FBF9F5] border border-stone-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600">
                    Administrar categorías de {tipo === 'ingreso' ? 'Ingresos' : 'Egresos'}
                  </span>
                  <button type="button" onClick={() => setMostrandoCrearCategoria(false)}>
                    <X className="w-4 h-4 text-stone-400 hover:text-stone-700" />
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nueva categoría..."
                    value={nuevaCatNombre}
                    onChange={(e) => setNuevaCatNombre(e.target.value)}
                    className="w-full bg-white border border-stone-300 p-2 text-xs rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={agregarNuevaCategoria}
                    className="bg-orange-900 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {categorias[tipo]?.map((cat) => (
                    <span key={cat} className="inline-flex items-center gap-1 bg-white border border-stone-200 px-2 py-1 rounded-lg text-xs font-medium text-stone-700">
                      {cat}
                      <button
                        type="button"
                        onClick={() => eliminarCategoria(cat)}
                        className="text-stone-400 hover:text-red-600 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-orange-900 hover:bg-orange-950 text-white font-semibold p-3 rounded-2xl shadow-sm transition text-sm active:scale-[0.99]"
            >
              Guardar {tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ObligacionesFijas obligaciones={obligaciones} alActualizar={cargarDatos} />
          </div>
          <div className="md:col-span-1">
            <GraficaEgresos transacciones={transacciones} />
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm border border-stone-200/80 p-6 rounded-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-800" /> Historial de Movimientos
            </h2>

            <div className="flex gap-1 bg-[#F6F3EC] p-1 rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setFiltroHistorial('todos')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  filtroHistorial === 'todos' ? 'bg-orange-950 text-white' : 'text-stone-600'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroHistorial('ingreso')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  filtroHistorial === 'ingreso' ? 'bg-emerald-700 text-white' : 'text-stone-600'
                }`}
              >
                Ingresos
              </button>
              <button
                onClick={() => setFiltroHistorial('egreso')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  filtroHistorial === 'egreso' ? 'bg-rose-700 text-white' : 'text-stone-600'
                }`}
              >
                Egresos
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-[#F6F3EC] text-stone-700 font-semibold">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Fecha</th>
                  <th className="p-3.5">Categoría</th>
                  <th className="p-3.5">Descripción</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5 text-right">Monto</th>
                  <th className="p-3.5 text-center rounded-r-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transaccionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-xs text-stone-400">
                      No hay registros guardados en esta vista.
                    </td>
                  </tr>
                ) : (
                  transaccionesFiltradas.map((t) => {
                    const esObligacion = t.categoria === 'Obligación Fija' || t.tipo === 'obligacion';
                    return (
                      <tr key={t.id} className="hover:bg-[#FBF9F5]/80 transition">
                        <td className="p-3.5 font-medium text-xs">
                          {new Date(t.fecha || t.created_at).toLocaleDateString('es-CO')}
                        </td>
                        <td className="p-3.5 font-medium">{t.categoria}</td>
                        <td className="p-3.5 text-xs text-stone-500">{t.descripcion || '-'}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              t.tipo === 'ingreso'
                                ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-200'
                                : esObligacion
                                ? 'bg-purple-100/80 text-purple-950 border border-purple-200'
                                : 'bg-orange-100/80 text-orange-950 border border-orange-200'
                            }`}
                          >
                            {esObligacion ? 'obligación' : t.tipo}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-bold text-stone-900">
                          {t.tipo === 'ingreso' ? '+' : '-'}${Number(t.monto).toLocaleString('es-CO')}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditandoTransaccion(t)}
                              className="p-1.5 text-stone-400 hover:text-orange-900 rounded-lg hover:bg-orange-50 transition"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => eliminarTransaccion(t.id)}
                              className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {editandoTransaccion && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={guardarEdicion}
            className="bg-[#F6F3EC] p-6 rounded-3xl border border-stone-300 max-w-md w-full space-y-4 shadow-xl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">Editar Movimiento</h3>
              <button
                type="button"
                onClick={() => setEditandoTransaccion(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Tipo</label>
                <select
                  value={editandoTransaccion.tipo}
                  onChange={(e) =>
                    setEditandoTransaccion({ ...editandoTransaccion, tipo: e.target.value })
                  }
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm"
                >
                  <option value="egreso">Egreso</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Monto ($)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={typeof editandoTransaccion.monto === 'number' ? editandoTransaccion.monto.toLocaleString('es-CO') : editandoTransaccion.monto}
                  onChange={(e) => {
                    const soloNumeros = e.target.value.replace(/\D/g, '');
                    setEditandoTransaccion({ 
                      ...editandoTransaccion, 
                      monto: soloNumeros ? Number(soloNumeros).toLocaleString('es-CO') : '' 
                    });
                  }}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Categoría</label>
                <input
                  type="text"
                  value={editandoTransaccion.categoria}
                  onChange={(e) =>
                    setEditandoTransaccion({ ...editandoTransaccion, categoria: e.target.value })
                  }
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Descripción</label>
                <input
                  type="text"
                  value={editandoTransaccion.descripcion || ''}
                  onChange={(e) =>
                    setEditandoTransaccion({ ...editandoTransaccion, descripcion: e.target.value })
                  }
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setEditandoTransaccion(null)}
                className="w-1/2 py-2.5 bg-stone-200 text-stone-700 rounded-xl text-sm font-semibold hover:bg-stone-300 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-orange-900 text-white rounded-xl text-sm font-semibold hover:bg-orange-950 transition"
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