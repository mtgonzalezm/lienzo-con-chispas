import React, { useState, forwardRef } from 'react';
import { HelpCircle } from 'lucide-react';

const C = { primary: '#78C841', border: '#c8e8a0', bg: '#f2fae8', muted: '#6b7280' };

const CanvasEditor = forwardRef(function CanvasEditor({
  imagenSrc, elementos, elementoSeleccionado, modo, esModoPreview,
  nuevaArea, puntosPoligono, cursorCanvas,
  onIniciarInteraccion, onMovimiento, onFinalizar,
  onClickCanvas, onElementoMouseDown, onElementoClick,
}, ref) {
  const [hoveredId, setHoveredId] = useState(null);

  const renderHotspot = (el) => {
    // En preview, los ocultos no se renderizan
    if (esModoPreview && el.oculto) return null;

    const color     = el.color || C.primary;
    const seleccion = !esModoPreview && el.id === elementoSeleccionado;
    const hovered   = hoveredId === el.id;
    const esQuiz    = el.tipoContenido === 'quiz';
    const emoji     = el.emoji || '💬';
    // mostrarEmoji: siempre visible; de lo contrario solo hover
    const emojiOpacity = el.mostrarEmoji ? 1 : (hovered ? 1 : (esModoPreview ? 0 : (seleccion ? 1 : 0.5)));

    const handlers = {
      onMouseDown:  (e) => onElementoMouseDown(el.id, e),
      onTouchStart: (e) => onElementoMouseDown(el.id, e),
      onClick:      (e) => onElementoClick(el.id, e),
      onMouseEnter: ()  => setHoveredId(el.id),
      onMouseLeave: ()  => setHoveredId(null),
    };

    // En edit mode, los ocultos se ven semitransparentes con borde punteado
    const ocultoBg    = el.oculto && !esModoPreview ? 'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(251,65,65,0.08) 4px,rgba(251,65,65,0.08) 8px)' : undefined;
    const ocultoBorde = el.oculto && !esModoPreview ? '#FB414166' : undefined;

    // ── POLÍGONO ──────────────────────────────────────────────────────────────
    if (el.tipo === 'poligono') {
      const cx = el.puntos.reduce((s, p) => s + p.x, 0) / el.puntos.length;
      const cy = el.puntos.reduce((s, p) => s + p.y, 0) / el.puntos.length;
      const polyOpacity = el.oculto && !esModoPreview ? 0.4 : 1;

      return (
        <React.Fragment key={el.id}>
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', zIndex: 10, pointerEvents: 'none', opacity: polyOpacity }}
            viewBox="0 0 100 100" preserveAspectRatio="none"
          >
            <polygon
              points={el.puntos.map(p => `${p.x},${p.y}`).join(' ')}
              fill={esModoPreview ? (hovered ? `${color}28` : 'transparent') : (seleccion ? `${color}28` : `${color}18`)}
              stroke={ocultoBorde || (esModoPreview ? (hovered ? color : 'transparent') : (seleccion ? color : `${color}88`))}
              strokeWidth={seleccion ? '0.5' : '0.3'}
              strokeDasharray={el.oculto ? '2,1' : (seleccion || esModoPreview ? '' : '1.5,0.8')}
              style={{ cursor: 'pointer', pointerEvents: 'all', transition: 'fill 0.2s, stroke 0.2s' }}
              {...handlers}
            />
          </svg>

          {/* Emoji en el centroide */}
          <div
            style={{
              position: 'absolute', left: `${cx}%`, top: `${cy}%`,
              transform: 'translate(-50%,-50%)', zIndex: 12, pointerEvents: 'none',
              opacity: esModoPreview ? (el.mostrarEmoji ? 1 : (hovered ? 1 : 0)) : emojiOpacity,
              transition: 'opacity 0.2s', fontSize: '20px',
              filter: esQuiz ? 'none' : undefined,
            }}
          >
            {esQuiz
              ? <HelpCircle size={20} color={color} />
              : <span>{emoji}</span>
            }
          </div>

          {seleccion && (
            <div style={{ position: 'absolute', left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, calc(-50% - 22px))', background: color, color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', zIndex: 13, pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: `0 2px 8px ${color}66` }}>
              {el.nombre}{el.oculto ? ' 🚫' : ''}
            </div>
          )}
        </React.Fragment>
      );
    }

    // ── PIN / RECTÁNGULO / CÍRCULO ────────────────────────────────────────────
    const esPin  = el.tipo === 'pin';
    const esCirc = el.tipo === 'circulo';

    const borderStyle = ocultoBorde
      ? `1.5px dashed ${ocultoBorde}`
      : esModoPreview
        ? 'none'
        : seleccion
          ? `2px solid ${color}`
          : `1.5px dashed ${color}77`;

    const bgStyle = esPin
      ? 'transparent'
      : ocultoBg
        ? ocultoBg
        : esModoPreview
          ? (hovered ? `${color}22` : 'transparent')
          : (seleccion ? `${color}28` : `${color}15`);

    // En preview: invisible si oculto (ya filtrado arriba, pero por si acaso)
    const baseOpacity = esModoPreview
      ? (el.mostrarEmoji ? 1 : (hovered ? 1 : 0))
      : (el.oculto ? 0.4 : 1);

    return (
      <div
        key={el.id}
        {...handlers}
        style={{
          position: 'absolute',
          left:   `${esPin ? el.x : (el.w > 0 ? el.x : el.x + el.w)}%`,
          top:    `${esPin ? el.y : (el.h > 0 ? el.y : el.y + el.h)}%`,
          width:  esPin ? '44px' : `${Math.abs(el.w)}%`,
          height: esPin ? '44px' : `${Math.abs(el.h)}%`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transform: esPin ? 'translate(-50%,-50%)' : 'none',
          borderRadius: esCirc ? '50%' : (esPin ? '0' : '6px'),
          border: borderStyle,
          background: bgStyle,
          opacity: baseOpacity,
          boxShadow: seleccion ? `0 0 0 3px ${color}44, 0 4px 16px ${color}44` : 'none',
          zIndex: seleccion ? 15 : 10,
          transition: 'all 0.18s',
        }}
      >
        {/* Pin */}
        {esPin && (
          <div style={{
            fontSize: '22px',
            opacity: esModoPreview
              ? (el.mostrarEmoji ? 1 : (hovered ? 1 : 0))
              : (el.oculto ? 0.5 : (seleccion ? 1 : 0.85)),
            transition: 'opacity 0.2s',
          }}>
            {esQuiz
              ? <HelpCircle size={26} color={color} style={{ filter: `drop-shadow(0 2px 6px ${color}88)` }} />
              : <span style={{ filter: `drop-shadow(0 2px 6px ${color}88)` }}>{emoji}</span>
            }
          </div>
        )}

        {/* Área/círculo: emoji en modo edición */}
        {!esPin && !esModoPreview && (
          <span style={{ fontSize: '16px', opacity: el.mostrarEmoji ? 0.8 : (seleccion ? 0.7 : 0.4), transition: 'opacity 0.2s' }}>
            {esQuiz ? null : emoji}
            {esQuiz && <HelpCircle size={16} color={color} style={{ opacity: 0.6 }} />}
          </span>
        )}

        {/* Área/círculo: emoji en preview */}
        {!esPin && esModoPreview && hovered && (
          <span style={{ fontSize: '20px' }}>
            {esQuiz ? null : emoji}
          </span>
        )}

        {seleccion && !esPin && (
          <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', background: color, color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap', boxShadow: `0 2px 6px ${color}55`, zIndex: 1 }}>
            {el.nombre}{el.oculto ? ' 🚫' : ''}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', backgroundColor: esModoPreview ? '#1a1a2e' : C.bg }}>
      <div style={{ position: 'relative', background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: esModoPreview ? '0 12px 60px rgba(0,0,0,0.5)' : `0 4px 24px rgba(120,200,65,0.15)`, maxWidth: '100%', border: esModoPreview ? 'none' : `1px solid ${C.border}` }}>
        <div
          ref={ref}
          onMouseDown={onIniciarInteraccion}
          onMouseMove={onMovimiento}
          onMouseUp={onFinalizar}
          onMouseLeave={onFinalizar}
          onClick={onClickCanvas}
          onTouchStart={onIniciarInteraccion}
          onTouchMove={onMovimiento}
          onTouchEnd={onFinalizar}
          style={{ position: 'relative', cursor: esModoPreview ? 'default' : 'crosshair', touchAction: 'none', minWidth: '300px' }}
        >
          {imagenSrc ? (
            <img src={imagenSrc} alt="Fondo" style={{ width: '100%', display: 'block', pointerEvents: 'none' }} />
          ) : (
            <div style={{ width: '680px', height: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, gap: '14px' }}>
              <span style={{ fontSize: '60px' }}>🖼</span>
              <span style={{ fontSize: '14px' }}>Sube una imagen para empezar</span>
            </div>
          )}

          {/* Preview área/círculo mientras se dibuja */}
          {nuevaArea && !esModoPreview && (
            <div style={{
              position: 'absolute', border: `2px solid ${C.primary}`, backgroundColor: 'rgba(120,200,65,0.1)',
              left: `${nuevaArea.w > 0 ? nuevaArea.x : nuevaArea.x + nuevaArea.w}%`,
              top:  `${nuevaArea.h > 0 ? nuevaArea.y : nuevaArea.y + nuevaArea.h}%`,
              width: `${Math.abs(nuevaArea.w)}%`, height: `${Math.abs(nuevaArea.h)}%`,
              borderRadius: modo === 'circulo' ? '50%' : '6px', pointerEvents: 'none',
            }} />
          )}

          {/* Preview polígono en construcción */}
          {puntosPoligono.length > 0 && !esModoPreview && (
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 }} viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points={puntosPoligono.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={C.primary} strokeWidth="0.45" strokeDasharray="1.5,0.8" />
              {cursorCanvas && puntosPoligono.length > 0 && (
                <line
                  x1={puntosPoligono[puntosPoligono.length - 1].x} y1={puntosPoligono[puntosPoligono.length - 1].y}
                  x2={cursorCanvas.x} y2={cursorCanvas.y}
                  stroke={C.primary} strokeWidth="0.25" strokeDasharray="0.8,0.8" opacity="0.5"
                />
              )}
              {puntosPoligono.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.1" fill={C.primary} />)}
            </svg>
          )}

          {/* Hotspots */}
          {elementos.map(el => renderHotspot(el))}

          {/* Hint en preview */}
          {esModoPreview && elementos.some(el => !el.oculto) && (
            <div style={{ position: 'absolute', bottom: '10px', right: '12px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '11px', padding: '5px 10px', borderRadius: '20px', pointerEvents: 'none', backdropFilter: 'blur(4px)' }}>
              🔍 Pasa el ratón para explorar
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CanvasEditor;
