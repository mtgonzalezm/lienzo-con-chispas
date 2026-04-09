import React, { useState } from 'react';
import { Settings2, Type, HelpCircle, Trash2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import EditorWYSIWYG from './EditorWYSIWYG';
import EditorQuiz from './EditorQuiz';

const C = {
  green: '#78C841', orange: '#FF9B2F', red: '#FB4141',
  border: '#e5e7eb', borderAccent: '#c8e8a0',
  text: '#1a1a2e', muted: '#6b7280', panel: '#ffffff', bg: '#f9fafb',
};

const PALETA_COLORES = ['#03AED2','#9ED3DC','#FEFD99','#FF3737','#B7E778','#40DAB2','#BE6283','#ED7575'];

const EMOJIS = [
  '💬','📌','⭐','🔥','💡','📚','🎯','✅',
  '❓','❗','🔍','🗺️','🏆','💎','🎓','⚡',
  '🌟','🔑','🧩','📋','🎨','🖼️','📷','🌍',
];

const labelStyle = {
  fontSize: '10px', color: C.muted, display: 'block',
  marginBottom: '5px', textTransform: 'uppercase',
  letterSpacing: '0.7px', fontWeight: '700',
  fontFamily: "'Inter', sans-serif",
};

const inputStyle = {
  width: '100%', padding: '8px 11px', borderRadius: '8px',
  border: `1.5px solid ${C.border}`, boxSizing: 'border-box',
  fontSize: '13px', fontFamily: "'Inter', sans-serif",
  outline: 'none', background: '#fff', transition: 'border-color 0.15s',
  color: '#1a1a2e',
};

function Toggle({ checked, onChange, label, colorOn }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', gap: '8px' }}>
      <span style={{ fontSize: '12px', fontFamily: "'Inter', sans-serif", color: C.text, fontWeight: '500' }}>{label}</span>
      <div
        onClick={onChange}
        style={{
          width: '36px', height: '20px', borderRadius: '10px',
          background: checked ? (colorOn || C.green) : '#d1d5db',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          boxShadow: checked ? `0 0 0 3px ${(colorOn || C.green)}25` : 'none',
        }}
      >
        <div style={{
          position: 'absolute', top: '3px',
          left: checked ? '19px' : '3px',
          width: '14px', height: '14px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </div>
    </label>
  );
}

function Seccion({ children, style }) {
  return (
    <div style={{
      marginBottom: '14px',
      padding: '12px',
      background: C.bg,
      borderRadius: '10px',
      border: `1px solid ${C.border}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

export default function PanelPropiedades({ elemento, onUpdate, onBorrar, editorWysRef, paleta }) {
  const [mostrarSelectorEmoji, setMostrarSelectorEmoji] = useState(false);

  if (!elemento) {
    return (
      <aside style={{
        width: '280px', flexShrink: 0,
        borderLeft: `1.5px solid ${C.border}`,
        backgroundColor: C.panel,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        boxShadow: '-1px 0 0 rgba(0,0,0,0.04)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>👈</div>
          <p style={{ color: C.muted, fontSize: '13px', fontFamily: "'Inter', sans-serif", lineHeight: '1.6', margin: 0 }}>
            Selecciona un hotspot<br />para editar sus propiedades
          </p>
        </div>
      </aside>
    );
  }

  const {
    id, nombre, color = C.green, tipoContenido = 'texto', quiz, contenido,
    emoji = '💬', mostrarEmoji = false, oculto = false,
  } = elemento;

  return (
    <aside style={{
      width: '280px', flexShrink: 0,
      borderLeft: `1.5px solid ${C.border}`,
      backgroundColor: C.panel,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '-1px 0 0 rgba(0,0,0,0.04)',
    }}>

      {/* Cabecera */}
      <div style={{
        padding: '12px 14px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
        background: '#fff',
      }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: `${C.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings2 size={13} color={C.green} />
        </div>
        <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: "'Inter', sans-serif", color: C.text, letterSpacing: '0.3px' }}>
          Propiedades
        </span>
        {/* Pastilla de color del hotspot */}
        <div style={{ marginLeft: 'auto', width: '16px', height: '16px', borderRadius: '50%', background: color, boxShadow: `0 0 0 2px ${color}40` }} />
      </div>

      {/* Cuerpo */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

        {/* Nombre */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Nombre</label>
          <input
            value={nombre || ''}
            onChange={e => onUpdate({ nombre: e.target.value })}
            style={inputStyle}
            placeholder="Nombre del hotspot"
            onFocus={e => { e.target.style.borderColor = C.green; }}
            onBlur={e => { e.target.style.borderColor = C.border; }}
          />
        </div>

        {/* Emoji */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Emoji del hotspot</label>
          <button
            onClick={() => setMostrarSelectorEmoji(p => !p)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 11px', borderRadius: '8px',
              border: `1.5px solid ${mostrarSelectorEmoji ? color : C.border}`,
              background: '#fff', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '13px', color: C.text,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{emoji}</span>
              <span style={{ color: C.muted }}>Cambiar emoji</span>
            </span>
            <ChevronDown size={14} color={C.muted} style={{ transform: mostrarSelectorEmoji ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {mostrarSelectorEmoji && (
            <div style={{
              marginTop: '6px', padding: '8px', background: '#fff',
              border: `1.5px solid ${C.border}`, borderRadius: '10px',
              display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            }}>
              {EMOJIS.map(em => (
                <button
                  key={em}
                  onClick={() => { onUpdate({ emoji: em }); setMostrarSelectorEmoji(false); }}
                  style={{
                    padding: '6px', fontSize: '18px', borderRadius: '7px',
                    border: `1.5px solid ${emoji === em ? color : 'transparent'}`,
                    background: emoji === em ? `${color}15` : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.1s',
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: '8px' }}>
            <Toggle
              checked={mostrarEmoji}
              onChange={() => onUpdate({ mostrarEmoji: !mostrarEmoji })}
              label="Siempre visible (sin hover)"
              colorOn={C.green}
            />
          </div>
        </div>

        {/* Color */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Color del hotspot</label>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', padding: '4px 0' }}>
            {(paleta || PALETA_COLORES).map(c => (
              <button
                key={c}
                onClick={() => onUpdate({ color: c })}
                title={c}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: c,
                  border: color === c ? `3px solid ${C.text}` : '3px solid transparent',
                  cursor: 'pointer', flexShrink: 0, padding: 0,
                  boxShadow: color === c ? `0 0 0 1px ${C.text}, 0 2px 8px ${c}66` : `0 1px 4px rgba(0,0,0,0.15)`,
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.12s, box-shadow 0.12s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Visibilidad */}
        <Seccion style={{ background: oculto ? '#fff5f5' : '#f9fafb', borderColor: oculto ? '#fecaca' : C.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: oculto ? '6px' : '0' }}>
            {oculto
              ? <EyeOff size={13} color={C.red} />
              : <Eye size={13} color={C.green} />
            }
            <Toggle
              checked={!oculto}
              onChange={() => onUpdate({ oculto: !oculto })}
              label={oculto ? 'Hotspot oculto' : 'Hotspot visible'}
              colorOn={C.green}
            />
          </div>
          {oculto && (
            <p style={{ fontSize: '11px', fontFamily: "'Inter', sans-serif", color: C.red, margin: 0, lineHeight: '1.4' }}>
              No aparece en vista previa ni en la exportación.
            </p>
          )}
        </Seccion>

        {/* Tipo de contenido */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Tipo de contenido</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'texto', Icon: Type,        label: 'Texto'  },
              { id: 'quiz',  Icon: HelpCircle,  label: 'Quiz'   },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => onUpdate({ tipoContenido: opt.id })}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  padding: '8px', borderRadius: '8px',
                  border: `1.5px solid ${tipoContenido === opt.id ? color : C.border}`,
                  background: tipoContenido === opt.id ? `${color}12` : '#fff',
                  cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  fontFamily: "'Inter', sans-serif",
                  color: tipoContenido === opt.id ? color : C.muted,
                  transition: 'all 0.15s',
                  boxShadow: tipoContenido === opt.id ? `0 0 0 3px ${color}20` : 'none',
                }}
              >
                <opt.Icon size={13} /> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        {tipoContenido === 'texto' ? (
          <div>
            <label style={labelStyle}>Contenido</label>
            <EditorWYSIWYG key={id} ref={editorWysRef} initialContent={contenido || ''} />
          </div>
        ) : (
          <div>
            <label style={labelStyle}>Cuestionario</label>
            <EditorQuiz
              key={id}
              quiz={quiz}
              onUpdate={cambios => onUpdate({ quiz: { ...(quiz || {}), ...cambios } })}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, flexShrink: 0, background: '#fff' }}>
        <button
          onClick={onBorrar}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '8px', borderRadius: '8px',
            border: `1.5px solid ${C.red}30`,
            background: `${C.red}06`, cursor: 'pointer',
            fontSize: '12px', fontWeight: '600', fontFamily: "'Inter', sans-serif",
            color: C.red, transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${C.red}12`; e.currentTarget.style.borderColor = `${C.red}60`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${C.red}06`; e.currentTarget.style.borderColor = `${C.red}30`; }}
        >
          <Trash2 size={12} /> Eliminar hotspot
        </button>
      </div>
    </aside>
  );
}
