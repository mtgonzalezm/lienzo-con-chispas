import React from 'react';
import { Layers, MapPin, Square, Circle, Hexagon, HelpCircle, Trash2, FolderOpen, FolderX, EyeOff } from 'lucide-react';

const C = {
  primary: '#78C841', border: '#c8e8a0', bg: '#f2fae8',
  text: '#1a1a2e', muted: '#6b7280', danger: '#FB4141', panel: '#f7fdf2',
};

const ICON_TIPO = { pin: MapPin, rectangulo: Square, area: Square, circulo: Circle, poligono: Hexagon };

export default function PanelArbol({
  elementos, elementoSeleccionado, onSeleccionar, onBorrar,
  repositorio, onCargarProyecto, onBorrarRepo,
}) {
  return (
    <aside style={{ width: '220px', flexShrink: 0, borderRight: `1px solid ${C.border}`, backgroundColor: C.panel, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Hotspots ── */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Layers size={13} color={C.muted} />
        <span style={{ fontSize: '11px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Hotspots ({elementos.length})
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {elementos.length === 0 && (
          <p style={{ color: C.muted, fontSize: '11px', textAlign: 'center', padding: '20px 0', margin: 0, lineHeight: '1.6' }}>
            Sin hotspots.<br />Usa las herramientas<br />para añadir.
          </p>
        )}

        {elementos.map(el => {
          const IconTipo = ICON_TIPO[el.tipo] || Square;
          const sel      = el.id === elementoSeleccionado;
          const color    = el.color || C.primary;

          return (
            <div
              key={el.id}
              onClick={() => onSeleccionar(el.id)}
              className="arbol-item"
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '7px 8px', borderRadius: '8px', marginBottom: '2px',
                cursor: 'pointer',
                background: sel ? `${color}18` : 'transparent',
                border: `1px solid ${sel ? color : 'transparent'}`,
                transition: 'all 0.15s',
              }}
            >
              {/* Icono con color del hotspot */}
              <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconTipo size={12} color={color} />
              </div>

              {/* Nombre */}
              <span style={{ fontSize: '12px', color: sel ? color : C.text, fontWeight: sel ? '600' : '400', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {el.nombre}
              </span>

              {/* Badges */}
              {el.tipoContenido === 'quiz' && (
                <HelpCircle size={10} color={color} style={{ flexShrink: 0, opacity: 0.7 }} />
              )}
              {el.oculto && (
                <EyeOff size={10} color={C.danger} style={{ flexShrink: 0, opacity: 0.7 }} />
              )}

              {/* Delete */}
              <button
                onClick={e => { e.stopPropagation(); onBorrar(el.id); }}
                className="arbol-delete"
                title="Eliminar"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '1px', flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Proyectos guardados ── */}
      <div style={{ borderTop: `1px solid ${C.border}` }}>
        <div style={{ padding: '9px 12px 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FolderOpen size={12} color={C.muted} />
          <span style={{ fontSize: '10px', fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Proyectos ({repositorio.length})
          </span>
        </div>

        <div style={{ maxHeight: '140px', overflowY: 'auto', padding: '0 8px 8px' }}>
          {repositorio.length === 0 && (
            <p style={{ color: C.muted, fontSize: '11px', textAlign: 'center', padding: '8px 0', margin: 0 }}>Sin proyectos</p>
          )}
          {repositorio.map(p => (
            <div
              key={p.id}
              onClick={() => onCargarProyecto(p)}
              className="arbol-item"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '7px', marginBottom: '2px', cursor: 'pointer', background: 'transparent', border: `1px solid transparent`, transition: 'all 0.15s', fontSize: '11px', color: C.text }}
            >
              <span style={{ fontSize: '14px' }}>📁</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</span>
            </div>
          ))}
          {repositorio.length > 0 && (
            <button onClick={onBorrarRepo} style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer', color: C.danger, fontSize: '10px', fontFamily: 'system-ui', borderRadius: '5px', marginTop: '2px' }}>
              <FolderX size={10} /> Borrar lista
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
