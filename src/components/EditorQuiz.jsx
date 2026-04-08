import React from 'react';
import { List, ToggleLeft, Pencil, CheckSquare, Plus, Trash2 } from 'lucide-react';

const C = {
  primary: '#03AED2', border: '#c8e8ee', bg: '#eaf7fa',
  text: '#1a1a2e', muted: '#6b7280', danger: '#FF3737',
};

const TIPOS = [
  { id: 'multiple',    Icon: List,        label: 'Opción múltiple' },
  { id: 'truefalse',   Icon: ToggleLeft,  label: 'Verdadero / Falso' },
  { id: 'shortanswer', Icon: Pencil,      label: 'Respuesta corta' },
  { id: 'checkboxes',  Icon: CheckSquare, label: 'Casillas' },
];

const input = {
  width: '100%', padding: '7px 10px', borderRadius: '6px',
  border: `1px solid ${C.border}`, boxSizing: 'border-box',
  fontSize: '12px', fontFamily: 'system-ui', outline: 'none',
  background: '#fff',
};

const label = {
  fontSize: '10px', color: C.muted, display: 'block',
  marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '600',
};

export default function EditorQuiz({ quiz, onUpdate }) {
  const {
    tipo = 'multiple',
    pregunta = '',
    opciones = [],
    correctas = [],
    respuestaCorrecta = '',
    validar = false,
  } = quiz || {};

  const cambiarTipo = (nuevoTipo) => {
    let ops = opciones.length >= 2 ? opciones : ['', '', '', ''];
    if (nuevoTipo === 'truefalse') ops = ['Verdadero', 'Falso'];
    onUpdate({ tipo: nuevoTipo, opciones: ops, correctas: [] });
  };

  const setOp = (idx, val) => {
    const ops = [...opciones]; ops[idx] = val;
    onUpdate({ opciones: ops });
  };

  const toggleCorrecta = (idx) => {
    if (tipo === 'checkboxes') {
      onUpdate({ correctas: correctas.includes(idx) ? correctas.filter(c => c !== idx) : [...correctas, idx] });
    } else {
      onUpdate({ correctas: [idx] });
    }
  };

  const addOp = () => onUpdate({ opciones: [...opciones, ''] });

  const delOp = (idx) => {
    const ops = opciones.filter((_, i) => i !== idx);
    const nuevas = correctas.filter(c => c !== idx).map(c => c > idx ? c - 1 : c);
    onUpdate({ opciones: ops, correctas: nuevas });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Tipo */}
      <div>
        <span style={label}>Tipo</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          {TIPOS.map(t => (
            <button
              key={t.id}
              onClick={() => cambiarTipo(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 8px',
                borderRadius: '6px', border: `1.5px solid ${tipo === t.id ? C.primary : C.border}`,
                background: tipo === t.id ? 'rgba(3,174,210,0.1)' : '#fff',
                cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                color: tipo === t.id ? C.primary : C.muted, fontFamily: 'system-ui',
              }}
            >
              <t.Icon size={12} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pregunta */}
      <div>
        <span style={label}>Pregunta</span>
        <textarea
          value={pregunta}
          onChange={e => onUpdate({ pregunta: e.target.value })}
          placeholder="Escribe la pregunta..."
          rows={2}
          style={{ ...input, resize: 'vertical' }}
        />
      </div>

      {/* Respuesta corta */}
      {tipo === 'shortanswer' && (
        <div>
          <label style={{ ...label, display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'none', letterSpacing: 0, fontSize: '12px', fontWeight: 500, color: C.text }}>
            <input
              type="checkbox" checked={validar}
              onChange={e => onUpdate({ validar: e.target.checked })}
              style={{ accentColor: C.primary }}
            />
            Validar respuesta
          </label>
          {validar && (
            <input
              value={respuestaCorrecta}
              onChange={e => onUpdate({ respuestaCorrecta: e.target.value })}
              placeholder="Respuesta correcta esperada..."
              style={{ ...input, marginTop: '6px' }}
            />
          )}
        </div>
      )}

      {/* Opciones */}
      {tipo !== 'shortanswer' && (
        <div>
          <span style={label}>
            {tipo === 'checkboxes' ? 'Opciones (marca todas las correctas)' : 'Opciones (marca la correcta)'}
          </span>
          {opciones.map((op, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              {tipo === 'checkboxes' ? (
                <input type="checkbox" checked={correctas.includes(idx)} onChange={() => toggleCorrecta(idx)} style={{ accentColor: '#22c55e', cursor: 'pointer', flexShrink: 0 }} />
              ) : (
                <input type="radio" name={`q-${tipo}`} checked={correctas.includes(idx)} onChange={() => toggleCorrecta(idx)} style={{ accentColor: '#22c55e', cursor: 'pointer', flexShrink: 0 }} />
              )}
              <input
                value={op}
                onChange={e => setOp(idx, e.target.value)}
                readOnly={tipo === 'truefalse'}
                style={{ ...input, flex: 1, borderColor: correctas.includes(idx) ? '#22c55e' : C.border }}
              />
              {tipo !== 'truefalse' && opciones.length > 2 && (
                <button onClick={() => delOp(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger, padding: '2px', flexShrink: 0 }}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          {tipo !== 'truefalse' && opciones.length < 6 && (
            <button onClick={addOp} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: C.primary, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', fontFamily: 'system-ui', marginTop: '2px' }}>
              <Plus size={11} /> Añadir opción
            </button>
          )}
        </div>
      )}
    </div>
  );
}
