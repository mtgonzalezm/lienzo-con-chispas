import React from 'react';
import { Settings2, Type, HelpCircle, Trash2 } from 'lucide-react';
import EditorWYSIWYG from './EditorWYSIWYG';
import EditorQuiz from './EditorQuiz';

const C = {
  primary: '#03AED2', border: '#c8e8ee', bg: '#eaf7fa',
  text: '#1a1a2e', muted: '#6b7280', danger: '#FF3737', panel: '#f4fbfd',
};

const labelStyle = {
  fontSize: '10px', color: C.muted, display: 'block',
  marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700',
};

const inputStyle = {
  width: '100%', padding: '7px 10px', borderRadius: '7px',
  border: `1px solid ${C.border}`, boxSizing: 'border-box',
  fontSize: '13px', fontFamily: 'system-ui', outline: 'none', background: '#fff',
};

export default function PanelPropiedades({ elemento, onUpdate, onBorrar, editorWysRef, paleta }) {

  if (!elemento) {
    return (
      <aside style={{ width: '270px', flexShrink: 0, borderLeft: `1px solid ${C.border}`, backgroundColor: C.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <p style={{ color: C.muted, fontSize: '12px', textAlign: 'center', lineHeight: '1.7', margin: 0 }}>
          Selecciona un hotspot<br />para editar sus propiedades
        </p>
      </aside>
    );
  }

  const { id, nombre, color = C.primary, tipoContenido = 'texto', quiz, contenido } = elemento;

  return (
    <aside style={{ width: '270px', flexShrink: 0, borderLeft: `1px solid ${C.border}`, backgroundColor: C.panel, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Cabecera */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <Settings2 size={13} color={C.muted} />
        <span style={{ fontSize: '11px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Propiedades
        </span>
      </div>

      {/* Cuerpo (scrollable) */}
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

        {/* Color */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Color</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {paleta.map(c => (
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

        {/* Tipo de contenido */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Tipo de contenido</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'texto', Icon: Type,        label: 'Texto'  },
              { id: 'quiz',  Icon: HelpCircle,  label: 'Quiz'   },
            ].map(({ id: tid, Icon, label }) => (
              <button
                key={tid}
                onClick={() => onUpdate({ tipoContenido: tid })}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  padding: '7px', borderRadius: '7px',
                  border: `1.5px solid ${tipoContenido === tid ? color : C.border}`,
                  background: tipoContenido === tid ? `${color}15` : '#fff',
                  cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  color: tipoContenido === tid ? color : C.muted,
                  fontFamily: 'system-ui', transition: 'all 0.15s',
                }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Editor de contenido ── */}
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
