import React, { useState } from 'react';
import { X, Check, AlertCircle, RotateCcw } from 'lucide-react';

const sanitizar = (html = '') =>
  html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');

const C = {
  green: '#78C841', border: '#e5e7eb', bg: '#f9fafb',
  text: '#1a1a2e', muted: '#6b7280', danger: '#FB4141',
  verde: '#22c55e',
};

export default function VisorContenido({ elemento, onClose }) {
  const [seleccion,   setSeleccion]   = useState(null);
  const [selecciones, setSelecciones] = useState([]);
  const [respCorta,   setRespCorta]   = useState('');
  const [enviado,     setEnviado]     = useState(false);

  if (!elemento) return null;

  const { nombre, tipoContenido, contenido, quiz, color = C.green, emoji = '💬' } = elemento;

  const reiniciar = () => {
    setSeleccion(null); setSelecciones([]); setRespCorta(''); setEnviado(false);
  };

  const correctas = quiz?.correctas || [];
  let esCorrectoFinal = false;
  let sinValidacion   = false;

  if (enviado && quiz) {
    if (quiz.tipo === 'multiple' || quiz.tipo === 'truefalse') {
      esCorrectoFinal = correctas.includes(seleccion);
    } else if (quiz.tipo === 'checkboxes') {
      esCorrectoFinal = correctas.length > 0 &&
        selecciones.length === correctas.length &&
        selecciones.every(s => correctas.includes(s));
    } else if (quiz.tipo === 'shortanswer') {
      if (!quiz.validar) { sinValidacion = true; esCorrectoFinal = true; }
      else esCorrectoFinal = respCorta.trim().toLowerCase() === (quiz.respuestaCorrecta || '').trim().toLowerCase();
    }
  }

  const puedeEnviar = (() => {
    if (!quiz) return false;
    if (quiz.tipo === 'multiple' || quiz.tipo === 'truefalse') return seleccion !== null;
    if (quiz.tipo === 'checkboxes') return selecciones.length > 0;
    if (quiz.tipo === 'shortanswer') return respCorta.trim().length > 0;
    return false;
  })();

  const estiloOpcion = (idx, seleccionado) => {
    let bg = '#fff', borde = C.border;
    if (enviado) {
      if (correctas.includes(idx)) { bg = '#f0fdf4'; borde = C.verde; }
      else if (seleccionado)       { bg = '#fff5f5'; borde = C.danger; }
    } else if (seleccionado) {
      bg = `${color}10`; borde = color;
    }
    return { bg, borde };
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(10,10,20,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff', borderRadius: '20px',
          width: '560px', maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{
          padding: '20px 22px 16px',
          borderBottom: `2px solid ${color}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
          background: `linear-gradient(135deg, ${color}08 0%, #fff 100%)`,
          borderRadius: '20px 20px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '26px' }}>{emoji}</span>
            <div>
              <h2 style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '17px', color: C.text, fontWeight: '700', lineHeight: 1.3 }}>
                {nombre || (tipoContenido === 'quiz' ? 'Cuestionario' : 'Información')}
              </h2>
              <span style={{ fontSize: '11px', fontFamily: "'Inter', sans-serif", color: C.muted, fontWeight: '500' }}>
                {tipoContenido === 'quiz' ? '📝 Cuestionario' : '📖 Contenido'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6', border: 'none', cursor: 'pointer',
              color: C.muted, padding: '6px', borderRadius: '8px', flexShrink: 0,
              display: 'flex', alignItems: 'center', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '22px 22px 26px' }}>

          {/* TEXTO */}
          {tipoContenido !== 'quiz' && (
            <div className="visor-contenido" dangerouslySetInnerHTML={{ __html: sanitizar(contenido || '') }} />
          )}

          {/* QUIZ */}
          {tipoContenido === 'quiz' && quiz && (
            <>
              <p style={{
                fontSize: '15px', fontFamily: "'Inter', sans-serif",
                color: C.text, marginBottom: '18px', lineHeight: '1.6',
                fontWeight: '600', marginTop: 0,
              }}>
                {quiz.pregunta || '—'}
              </p>

              {/* Múltiple / Verdadero-Falso */}
              {(quiz.tipo === 'multiple' || quiz.tipo === 'truefalse') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {(quiz.opciones || []).map((op, idx) => {
                    const sel = seleccion === idx;
                    const { bg, borde } = estiloOpcion(idx, sel);
                    return (
                      <button key={idx} onClick={() => !enviado && setSeleccion(idx)} disabled={enviado}
                        style={{
                          padding: '11px 14px', textAlign: 'left', borderRadius: '10px',
                          border: `1.5px solid ${borde}`, background: bg,
                          cursor: enviado ? 'default' : 'pointer',
                          fontSize: '14px', fontFamily: "'Inter', sans-serif", color: C.text,
                          display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.15s',
                        }}
                      >
                        <span style={{
                          width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${borde}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: '700',
                          color: sel ? color : C.muted, background: sel && !enviado ? `${color}12` : 'transparent',
                        }}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span style={{ flex: 1 }}>{op}</span>
                        {enviado && correctas.includes(idx) && <Check size={14} color={C.verde} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Casillas */}
              {quiz.tipo === 'checkboxes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {(quiz.opciones || []).map((op, idx) => {
                    const sel = selecciones.includes(idx);
                    const { bg, borde } = estiloOpcion(idx, sel);
                    return (
                      <button key={idx}
                        onClick={() => { if (enviado) return; setSelecciones(prev => prev.includes(idx) ? prev.filter(s => s !== idx) : [...prev, idx]); }}
                        disabled={enviado}
                        style={{
                          padding: '11px 14px', textAlign: 'left', borderRadius: '10px',
                          border: `1.5px solid ${borde}`, background: bg,
                          cursor: enviado ? 'default' : 'pointer',
                          fontSize: '14px', fontFamily: "'Inter', sans-serif", color: C.text,
                          display: 'flex', alignItems: 'center', gap: '10px',
                        }}
                      >
                        <span style={{
                          width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                          border: `2px solid ${borde}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: sel ? (enviado ? (correctas.includes(idx) ? C.verde : C.danger) : color) : 'transparent',
                        }}>
                          {sel && <Check size={11} color="#fff" />}
                        </span>
                        <span style={{ flex: 1 }}>{op}</span>
                        {enviado && correctas.includes(idx) && <Check size={14} color={C.verde} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Respuesta corta */}
              {quiz.tipo === 'shortanswer' && (
                <input
                  value={respCorta}
                  onChange={e => !enviado && setRespCorta(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && puedeEnviar && !enviado) setEnviado(true); }}
                  placeholder="Escribe tu respuesta..."
                  disabled={enviado}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                    border: `1.5px solid ${enviado ? (esCorrectoFinal ? C.verde : C.danger) : C.border}`,
                    boxSizing: 'border-box', fontSize: '14px', outline: 'none',
                    fontFamily: "'Inter', sans-serif", marginBottom: '16px', display: 'block',
                    transition: 'border-color 0.15s',
                  }}
                />
              )}

              {/* Feedback */}
              {enviado && (
                <div style={{
                  padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
                  background: esCorrectoFinal ? '#f0fdf4' : '#fff5f5',
                  border: `1.5px solid ${esCorrectoFinal ? C.verde : C.danger}`,
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '14px', fontWeight: '700', fontFamily: "'Inter', sans-serif",
                  color: esCorrectoFinal ? '#166534' : '#991b1b',
                }}>
                  {esCorrectoFinal ? <Check size={18} /> : <AlertCircle size={18} />}
                  {sinValidacion ? 'Respuesta registrada ✓' : (esCorrectoFinal ? '¡Correcto! 🎉' : 'Incorrecto — inténtalo de nuevo')}
                </div>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {!enviado ? (
                  <button onClick={() => setEnviado(true)} disabled={!puedeEnviar}
                    style={{
                      flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
                      background: puedeEnviar ? color : C.border,
                      color: '#fff', cursor: puedeEnviar ? 'pointer' : 'not-allowed',
                      fontSize: '14px', fontWeight: '600', fontFamily: "'Inter', sans-serif",
                      transition: 'background 0.15s',
                    }}
                  >
                    Enviar respuesta
                  </button>
                ) : (
                  <button onClick={reiniciar}
                    style={{
                      flex: 1, padding: '11px', borderRadius: '10px',
                      border: `1.5px solid ${C.border}`, background: '#f9fafb',
                      color: C.text, cursor: 'pointer', fontSize: '13px',
                      fontFamily: "'Inter', sans-serif",
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    <RotateCcw size={13} /> Intentar de nuevo
                  </button>
                )}
                <button onClick={onClose}
                  style={{
                    padding: '11px 18px', borderRadius: '10px',
                    border: `1.5px solid ${C.border}`, background: '#fff',
                    color: C.muted, cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif", fontSize: '13px',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
