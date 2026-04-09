import React from 'react';
import { Layers, MapPin, Square, Circle, Hexagon, HelpCircle, Trash2, FolderOpen, FolderX, EyeOff } from 'lucide-react';

const C = {
  green: '#78C841', border: '#e5e7eb', borderAccent: '#c8e8a0',
  text: '#1a1a2e', muted: '#6b7280', danger: '#FB4141', bg: '#ffffff', panel: '#ffffff',
};

const ICON_TIPO = { pin: MapPin, rectangulo: Square, area: Square, circulo: Circle, poligono: Hexagon };

const label = {
  fontSize: '10px', fontFamily: "'Inter', sans-serif", fontWeight: '700',
  color: C.muted, textTransform: 'uppercase', letterSpacing: '0.7px',
};

export default function PanelArbol({
  elementos, elementoSeleccionado, onSeleccionar, onBorrar,
  repositorio, onCargarProyecto, onBorrarRepo,
}) {
  return (
    <aside style={{
      width: '220px', flexShrink: 0,
      borderRight: `2px solid ${C.green}`,
      backgroundColor: C.panel,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: `2px 0 12px rgba(120,200,65,0.12)`,
    }}>

      {/* Cabecera hotspots */}
      <div style={{
        padding: '12px 14px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: '7px',
      }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: `${C.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={13} color={C.green} />
        </div>
        <span style={{ ...label, color: C.text, fontSize: '11px' }}>
          Hotspots <span style={{ color: C.muted, fontWeight: '500' }}>({elementos.length})</span>
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {elementos.length === 0 && (
          <p style={{ color: C.muted, fontSize: '12px', fontFamily: "'Inter', sans-serif", textAlign: 'center', padding: '24px 8px', margin: 0, lineHeight: '1.6' }}>
            Sin hotspots.<br />Usa las herramientas<br />para añadir.
          </p>
        )}

        {elementos.map(el => {
          const IconTipo = ICON_TIPO[el.tipo] || Square;
          const sel      = el.id === elementoSeleccionado;
          const color    = el.color || C.green;

          return (
            <div
              key={el.id}
              onClick={() => onSeleccionar(el.id)}
              className="arbol-item"
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '7px 8px', borderRadius: '9px', marginBottom: '2px',
                cursor: 'pointer',
                background: sel ? `${color}14` : 'transparent',
                border: `1px solid ${sel ? color + '55' : 'transparent'}`,
                transition: 'all 0.15s',
                opacity: el.oculto ? 0.55 : 1,
              }}
            >
              <div style={{
                width: '24px', height: '24px', borderRadius: '6px',
                background: `${color}20`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <IconTipo size={12} color={color} />
              </div>

              <span style={{
                fontSize: '12px', fontFamily: "'Inter', sans-serif",
                color: sel ? color : C.text,
                fontWeight: sel ? '600' : '400',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {el.emoji && <span style={{ marginRight: '4px' }}>{el.emoji}</span>}
                {el.nombre}
              </span>

              {el.tipoContenido === 'quiz' && (
                <HelpCircle size={10} color={color} style={{ flexShrink: 0, opacity: 0.7 }} />
              )}
              {el.oculto && (
                <EyeOff size={10} color={C.danger} style={{ flexShrink: 0, opacity: 0.7 }} />
              )}

              <button
                onClick={e => { e.stopPropagation(); onBorrar(el.id); }}
                className="arbol-delete"
                title="Eliminar"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.muted, padding: '2px', flexShrink: 0,
                  opacity: 0, transition: 'opacity 0.15s',
                }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Proyectos guardados */}
      <div style={{ borderTop: `1px solid ${C.border}` }}>
        <div style={{ padding: '10px 14px 6px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderOpen size={11} color="#FF9B2F" />
          </div>
          <span style={{ ...label }}>
            Proyectos <span style={{ fontWeight: '500', textTransform: 'none', letterSpacing: 0 }}>({repositorio.length})</span>
          </span>
        </div>

        <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '0 8px 8px' }}>
          {repositorio.length === 0 && (
            <p style={{ color: C.muted, fontSize: '11px', fontFamily: "'Inter', sans-serif", textAlign: 'center', padding: '8px 0', margin: 0 }}>
              Sin proyectos guardados
            </p>
          )}
          {repositorio.map(p => (
            <div
              key={p.id}
              onClick={() => onCargarProyecto(p)}
              className="arbol-item"
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '6px 8px', borderRadius: '8px', marginBottom: '2px',
                cursor: 'pointer', transition: 'all 0.15s',
                background: 'transparent', border: '1px solid transparent',
                fontSize: '12px', fontFamily: "'Inter', sans-serif", color: C.text,
              }}
            >
              <span style={{ fontSize: '14px' }}>📁</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.nombre}
              </span>
            </div>
          ))}
          {repositorio.length > 0 && (
            <button
              onClick={onBorrarRepo}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', width: '100%',
                padding: '5px 8px', background: 'none', border: 'none',
                cursor: 'pointer', color: C.danger,
                fontSize: '11px', fontFamily: "'Inter', sans-serif",
                borderRadius: '6px', marginTop: '2px', transition: 'background 0.15s',
              }}
            >
              <FolderX size={11} /> Borrar lista
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
