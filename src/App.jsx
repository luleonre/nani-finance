import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import PinAuth from './components/PinAuth';
import ExportarExcel from './components/ExportarExcel';
import ObligacionesFijas from './components/ObligacionesFijas';
import GraficaEgresos from './components/GraficaEgresos';
import { PlusCircle, Wallet, TrendingUp } from 'lucide-react';

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [disponibleReal, setDisponibleReal] = useState(0);
  const [transacciones, setTransacciones] = useState([]);
  const [obligaciones, setObligaciones] = useState([]);
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('Comida');
  const [tipo, setTipo] = useState('egreso');

  useEffect(() => {
    if (autenticado) {
      cargarDatos();
    }
  }, [autenticado]);

  const cargarDatos = async () => {
    const { data: transData } = await supabase
      .from('transacciones')
      .select('*')
      .order('fecha', { ascending: false });

    const { data: obligData } = await supabase
      .from('obligaciones_fijas')
      .select('*')
      .order('dia_pago_limite', { ascending: true });

    if (transData && obligData) {
      setTransacciones(transData);
      setObligaciones(obligData);
      calcularDisponible(transData, obligData);
    }
  };

  const calcularDisponible = (transData, obligData) => {
    const ingresos = transData.filter(t => t.tipo === 'ingreso').reduce((acc, t) => acc + Number(t.monto), 0);
    const egresos = transData.filter(t => t.tipo === 'egreso').reduce((acc, t) => acc + Number(t.monto), 0);
    const obligacionesPendientes = obligData
      .filter(o => !o.pagado)
      .reduce((acc, o) => acc + Number(o.monto_estimado), 0);

    setDisponibleReal(ingresos - egresos - obligacionesPendientes);
  };

  const registrarTransaccion = async (e) => {
    e.preventDefault();
    if (!nuevoMonto) return;

    await supabase.from('transacciones').insert([
      {
        monto: parseFloat(nuevoMonto),
        tipo,
        categoria: nuevaCategoria,
        cuenta_id: 'd3b07384-d113-42e8-89c0-fdb692b1f8e4'
      }
    ]);

    setNuevoMonto('');
    cargarDatos();
  };

  if (!autenticado) {
    return <PinAuth onSuccess={() => setAutenticado(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-stone-800 p-4 md:p-10 font-sans">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8 border-b border-stone-300/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-orange-950">
            Nani Finance
          </h1>
          <p className="text-xs font-medium text-stone-500 mt-0.5">Control Financiero Personal</p>
        </div>
        <ExportarExcel transacciones={transacciones} />
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta de Disponible Real */}
        <div className="bg-white/90 backdrop-blur-sm border border-stone-200/80 p-6 rounded-3xl shadow-sm md:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3 text-orange-900">
              <div className="p-2 bg-orange-100/70 rounded-xl border border-orange-200/50">
                <Wallet className="w-5 h-5 text-orange-900" />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase text-stone-500">Disponible Real</span>
            </div>
            <p className="text-4xl font-extrabold tracking-tight text-orange-950">
              ${disponibleReal.toLocaleString('es-CO')}
            </p>
          </div>
          <span className="text-[11px] font-medium text-stone-400 mt-4">
            * Descuenta automáticamente los pagos pendientes
          </span>
        </div>

        {/* Registro Rápido */}
        <div className="bg-white/90 backdrop-blur-sm border border-stone-200/80 p-6 rounded-3xl shadow-sm md:col-span-2">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-orange-800" /> Registro Rápido
          </h2>
          <form onSubmit={registrarTransaccion} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="number"
              placeholder="Monto ($)"
              value={nuevoMonto}
              onChange={(e) => setNuevoMonto(e.target.value)}
              className="bg-[#FBF9F5] border border-stone-300 text-stone-900 placeholder:text-stone-400 p-3 rounded-2xl focus:outline-none focus:border-orange-800 focus:ring-2 focus:ring-orange-800/15 text-sm font-medium transition"
            />
            <select
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              className="bg-[#FBF9F5] border border-stone-300 text-stone-800 p-3 rounded-2xl text-sm font-medium focus:outline-none focus:border-orange-800 transition"
            >
              <option value="Comida">Comida</option>
              <option value="Transporte">Transporte</option>
              <option value="Arriendo">Arriendo</option>
              <option value="Servicios">Servicios</option>
              <option value="Nómina">Nómina</option>
            </select>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="bg-[#FBF9F5] border border-stone-300 text-stone-800 p-3 rounded-2xl text-sm font-medium focus:outline-none focus:border-orange-800 transition"
            >
              <option value="egreso">Egreso</option>
              <option value="ingreso">Ingreso</option>
            </select>
            <button
              type="submit"
              className="bg-orange-900 hover:bg-orange-950 text-white font-semibold p-3 rounded-2xl shadow-sm transition text-sm active:scale-[0.98]"
            >
              Guardar
            </button>
          </form>
        </div>

        {/* Fila 2: Obligaciones Fijas (2 cols) + Gráfica Egresos (1 col) */}
        <div className="md:col-span-2">
          <ObligacionesFijas obligaciones={obligaciones} alActualizar={cargarDatos} />
        </div>
        <div className="md:col-span-1">
          <GraficaEgresos transacciones={transacciones} />
        </div>

        {/* Fila 3: Historial de Movimientos */}
        <div className="bg-white/90 backdrop-blur-sm border border-stone-200/80 p-6 rounded-3xl shadow-sm md:col-span-3">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-800" /> Historial de Movimientos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-[#F6F3EC] text-stone-700 font-semibold">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Fecha</th>
                  <th className="p-3.5">Categoría</th>
                  <th className="p-3.5">Descripción</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5 text-right rounded-r-xl">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transacciones.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FBF9F5]/80 transition">
                    <td className="p-3.5 font-medium">{new Date(t.fecha).toLocaleDateString()}</td>
                    <td className="p-3.5">{t.categoria}</td>
                    <td className="p-3.5 text-xs text-stone-500">{t.descripcion || '-'}</td>
                    <td className="p-3.5">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        t.tipo === 'ingreso' 
                          ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-200' 
                          : 'bg-orange-100/80 text-orange-950 border border-orange-200'
                      }`}>
                        {t.tipo}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-stone-900">
                      ${Number(t.monto).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}