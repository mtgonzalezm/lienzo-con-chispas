import React, { useState } from 'react';
import { Settings2, Type, HelpCircle, Trash2, Eye, EyeOff, Smile } from 'lucide-react';
import EditorWYSIWYG from './EditorWYSIWYG';
import EditorQuiz from './EditorQuiz';

const C = {
  primary: '#78C841', border: '#c8e8a0', bg: '#f2fae8',
  text: '#1a1a2e', muted: '#6b7280', danger: '#FB4141', panel: '#f7fdf2',
};

const PALETA_COLORES = ['#03AED2','#9ED3DC','#FEFD99','#FF3737','#B7E778','#40DAB2','#BE6283','#ED7575'];

const EMOJIS = [
  '💬','📌','⭐','🔥','💡','📚','🎯','✅',
  '❓','❗','🔍','🗺️','🏆','💎','🎓','⚡',
  '🌟','🔑','🧩','📋','🎨','🖼️','📷','🌍',
];

const labelStyle = {
  fontSize: '10px', color: C.muted, display: 'block',
  marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700',
};

const inputStyle = {
  width: '100%', padding: '7px 10px', borderRadius: '7px',
  border: `1px solid ${C.border}`, boxSizing: 'border-box',
  fontSize: '13px', fontFamily: 'system-ui', outline: 'none', background: '#fff',
};

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
      <span style={{ fontSize: '12px', color: C.text, fontWeight: '500' }}>{label}</span>
      <div
        onClick={onChange}
        style={{
          width: '34px', height: '18px', borderRadius: '9px',
          background: checked ? C.primary : '#d1d5db',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '2px',
          left: checked ? '18px' : '2px',
          width: '14px', height: '14px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
    </label>
  );
}

export default function PanelPropiedades({ elemento, onUpdate, onBorrar, editorWysRef, paleta }) {
  const [mostrarSelectorEmoji, setMostrarSelectorEmoji] = useState(false);

  if (!elemento) {
    return (
      <aside style={{ width: '270px', flexShrink: 0, borderLeft: `1px solid ${C.border}`, backgroundColor: C.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <p style={{ color: C.muted, fontSize: '12px', textAlign: 'center', lineHeight: '1.7', margin: 0 }}>
          Selecciona un hotspot<br />para editar sus propiedades
        </p>
      </aside>
    );
  }

  const {
    id, nombre, color = C.primary, tipoContenido = 'texto', quiz, contenido,
    emoji = '💬', mostrarEmoji = false, oculto = false,
  } = elemento;

  return (
    <aside style={{ width: '270px', flexShrink: 0, borderLeft: `1px solid ${C.border}`, backgroundColor: C.panel, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Cabecera */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <Settings2 size={13} color={C.muted} />
        <span style={{ fontSize: '11px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Propiedades
        </span>
      </div>

      {/* Cuerpo */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 8px' }}>

        {/* Nombre */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Nombre</label>
          <input
            value={nombre || ''}
            onChange={e => onUpdate({ nombre: e.target.value })}
            style={inputStyle}
            placeholder="Nombre del hotspot"
          />
        </div>

        {/* ── Emoji ── */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Emoji</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setMostrarSelectorEmoji(p => !p)}
              style={{
                width: '40px', height: '40px', borderRadius: '8px', fontSize: '20px',
                border: `1.5px solid ${mostrarSelectorEmoji ? color : C.border}`,
                background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: mostrarSelectorEmoji ? `0 0 0 3px ${color}30` : 'none',
                transition: 'all 0.15s',
              }}
              title="Cambiar emoji"
            >
              {emoji}
            </button>
            <div style={{ flex: 1 }}>
              <Toggle
                checked={mostrarEmoji}
                onChange={() => onUpdate({ mostrarEmoji: !mostrarEmoji })}
                label="Siempre visible"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Smile size={11} color={C.muted} />
            </div>
          </div>

          {/* Selector de emojis desplegable */}
          {mostrarSelectorEmoji && (
            <div style={{
              marginTop: '8px', padding: '8px', background: '#fff',
              border: `1px solid ${C.border}`, borderRadius: '10px',
              display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}>
              {EMOJIS.map(em => (
                <button
                  key={em}
                  onClick={() => { onUpdate({ emoji: em }); setMostrarSelectorEmoji(false); }}
                  style={{
                    padding: '6px', fontSize: '18px', borderRadius: '6px',
                    border: `1.5px solid ${emoji === em ? color : 'transparent'}`,
                    background: emoji === em ? `${color}15` : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.1s',
                  }}
                  title={em}
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Color del hotspot</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(paleta || PALETA_COLORES).map(c => (
              <button
                key={c}
                onClick={() => onUpdate({ color: c })}
                title={c}
                style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  backgroundColor: c, border: `3px solid ${color === c ? C.text : 'transparent'}`,
                  cursor: 'pointer', flexShrink: 0, padding: 0,
                  boxShadow: color === c ? `0 0 0 1px ${C.text}` : `0 1px 3px rgba(0,0,0,0.15)`,
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.12s',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Visibilidad ── */}
        <div style={{ marginBottom: '14px', padding: '8px 10px', background: oculto ? '#fef2f2' : '#fff', borderRadius: '8px', border: `1px solid ${oculto ? '#fecaca' : C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            {oculto ? <EyeOff size={12} color={C.danger} /> : <Eye size={12} color={C.primary} />}
            <Toggle
              checked={!oculto}
              onChange={() => onUpdate({ oculto: !oculto })}
              label={oculto ? 'Hotspot oculto' : 'Hotspot visible'}
            />
          </div>
          {oculto && (
            <p style={{ fontSize: '10px', color: C.danger, margin: 0, lineHeight: '1.4' }}>
              Este hotspot no aparecerá en la vista previa ni en la exportación.
            </p>
          )}
        </div>

        {/* Tipo de contenido */}
        <div style={{ marginBottom: '14px' }}>
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
                  padding: '7px', borderRadius: '7px',
                  border: `1.5px solid ${tipoContenido === opt.id ? color : C.border}`,
                  background: tipoContenido === opt.id ? `${color}15` : '#fff',
                  cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  color: tipoContenido === opt.id ? color : C.muted,
                  fontFamily: 'system-ui', transition: 'all 0.15s',
                }}
              >
                <opt.Icon size={13} /> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editor de contenido */}
        {tipoContenido === 'texto' ? (
          <div>
            <label style={labelStyle}>Contenido</label>
            <EditorWYSIWYG
              key={id}
              ref={editorWysRef}
              initialContent={contenido || ''}
            />
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
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button
          onClick={onBorrar}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '8px', borderRadius: '7px', border: `1px solid ${C.danger}33`,
            background: `${C.danger}08`, cursor: 'pointer', fontSize: '12px', fontWeight: '600',
            color: C.danger, fontFamily: 'system-ui', transition: 'background 0.15s',
          }}
        >
          <Trash2 size={12} /> Eliminar hotspot
        </button>
      </div>
    </aside>
  );
}
