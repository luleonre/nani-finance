import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function PinAuth({ onSuccess }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');

  const handleChange = (text, index) => {
    if (text.length > 1) return;
    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);

    if (text && index < 3) {
      document.getElementById(`pin-input-${index + 1}`).focus();
    }

    if (newPin.every(digit => digit !== '')) {
      validarPin(newPin.join(''));
    }
  };

  const validarPin = (pinIngresado) => {
    const pinGuardado = localStorage.getItem('nani_pin_code') || '1234';
    const ultimaActualizacion = localStorage.getItem('nani_pin_date');

    if (ultimaActualizacion) {
      const diasTranscurridos = (new Date() - new Date(ultimaActualizacion)) / (1000 * 60 * 60 * 24);
      if (diasTranscurridos >= 90) {
        setError('El PIN ha caducado (cumplió 90 días). Debes restablecerlo por correo.');
        return;
      }
    }

    if (pinIngresado === pinGuardado) {
      setError('');
      onSuccess();
    } else {
      setError('PIN incorrecto. Intenta de nuevo.');
      setPin(['', '', '', '']);
      document.getElementById('pin-input-0').focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EC] flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-stone-200/80 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-orange-100/70 text-orange-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-200/60">
          <Lock className="w-8 h-8 text-orange-800" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight mb-1">
          Nani Finance
        </h2>
        <p className="text-stone-500 text-sm mb-6">Introduce tu PIN de 4 dígitos</p>

        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              id={`pin-input-${index}`}
              type="password"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              className="w-12 h-14 text-center text-2xl font-bold bg-[#FBF9F5] text-orange-950 rounded-xl border border-stone-300 focus:border-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-800/15 transition"
            />
          ))}
        </div>

        {error && <p className="text-red-600 text-xs font-medium mb-4">{error}</p>}

        <button 
          onClick={() => alert('Se enviará un código de verificación al correo registrado.')}
          className="text-xs font-medium text-orange-800 hover:text-orange-950 hover:underline transition"
        >
          ¿Olvidaste tu PIN?
        </button>
      </div>
    </div>
  );
}