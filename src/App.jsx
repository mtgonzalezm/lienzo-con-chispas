import React, { useState, useRef, useEffect } from 'react';
import EditorWYSIWYG from './components/EditorWYSIWYG';

// ─── Paleta ──────────────────────────────────────────────────────────────────
const C = {
  primary : '#03AED2',
  light   : '#9ED3DC',
  yellow  : '#FEFD99',
  danger  : '#FF3737',
  bg      : '#eaf7fa',
  white   : '#ffffff',
  text    : '#1a1a2e',
  muted   : '#6b7280',
  border  : '#c8e8ee',
};

// ─── Constantes ───────────────────────────────────────────────────────────────
const MODOS = [
  { id: 'pin',        etiqueta: '📍', titulo: 'Pin (clic)' },
  { id: 'rectangulo', etiqueta: '▭',  titulo: 'Rectángulo (arrastrar)' },
  { id: 'circulo',    etiqueta: '◯',  titulo: 'Círculo (arrastrar)' },
  { id: 'poligono',   etiqueta: '⬡',  titulo: 'Polígono libre (clic por punto)' },
];

const ICONOS_PIN = ['📍','⭐','💡','⚠️','✅','🔍','📌','🎯','💬','🔔','❗','🏷️'];

// ─── Pequeño sanitizador para dangerouslySetInnerHTML ─────────────────────────
const sanitizar = (html = '') =>
  html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');

// ─── Helper de estilos de botón ───────────────────────────────────────────────
const btn = (extra = {}) => ({
  border: 'none', borderRadius: '8px', cursor: 'pointer',
  fontWeight: '600', fontFamily: 'system-ui', ...extra,
});

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [imagenSrc,        setImagenSrc]        = useState(null);
  const [elementos,        setElementos]        = useState([]);
  const [modo,             setModo]             = useState('pin');
  const [esModoAlumno,     setEsModoAlumno]     = useState(false);
  const [dibujando,        setDibujando]        = useState(false);
  const [nuevaArea,        setNuevaArea]        = useState(null);
  const [puntosPoligono,   setPuntosPoligono]   = useState([]);
  const [cursorCanvas,     setCursorCanvas]     = useState(null);
  const [editando,         setEditando]         = useState(null);
  const [pasoEdicion,      setPasoEdicion]      = useState(1);
  const [repositorio,      setRepositorio]      = useState([]);
  const [arrastrandoId,    setArrastrandoId]    = useState(null);
  const [respuestaUsuario, setRespuestaUsuario] = useState(null);

  const contenedorRef = useRef(null);
  const editorWysRef  = useRef(null);
  const lastDragPos   = useRef(null);
  const hasDragged    = useRef(false);

  // ─── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    const guardados = JSON.parse(localStorage.getItem('repositorio_chispas_final')) || [];
    setRepositorio(guardados);
  }, []);

  // ─── Coordenadas ────────────────────────────────────────────────────────────
  const obtenerCoordenadas = (clientX, clientY) => {
    const r = contenedorRef.current.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width)  * 100,
      y: ((clientY - r.top)  / r.height) * 100,
    };
  };

  const coordsDeEvento = (e) => {
    if (e.touches?.length)        return obtenerCoordenadas(e.touches[0].clientX,        e.touches[0].clientY);
    if (e.changedTouches?.length) return obtenerCoordenadas(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    return obtenerCoordenadas(e.clientX, e.clientY);
  };

  // ─── Interacción con el canvas ───────────────────────────────────────────────
  const iniciarInteraccion = (e) => {
    if (!imagenSrc || editando || esModoAlumno) return;
    if (modo === 'poligono' || arrastrandoId) return;

    const coords = coordsDeEvento(e);

    if (modo === 'pin') {
      setEditando({
        id: Date.now(), tipo: 'pin', x: coords.x, y: coords.y,
        titulo: '', contenido: '', icono: '📍', subTipo: 'texto',
        quiz: { pregunta: '', opciones: ['Sí', 'No'], correcta: 0 },
      });
      setPasoEdicion(1);
    } else {
      setDibujando(true);
      setNuevaArea({ x: coords.x, y: coords.y, w: 0, h: 0 });
    }
  };

  // Añadir punto al polígono (via onClick en el canvas)
  const manejarClickCanvas = (e) => {
    if (!imagenSrc || editando || esModoAlumno || modo !== 'poligono') return;
    if (hasDragged.current) { hasDragged.current = false; return; }
    setPuntosPoligono(prev => [...prev, coordsDeEvento(e)]);
  };

  const manejarMovimiento = (e) => {
    if (esModoAlumno) return;
    const coords = coordsDeEvento(e);

    if (dibujando) {
      setNuevaArea(prev => ({ ...prev, w: coords.x - prev.x, h: coords.y - prev.y }));
    }

    if (arrastrandoId && lastDragPos.current) {
      const dx = coords.x - lastDragPos.current.x;
      const dy = coords.y - lastDragPos.current.y;
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) hasDragged.current = true;
      setElementos(prev => prev.map(el => {
        if (el.id !== arrastrandoId) return el;
        if (el.tipo === 'poligono') {
          return { ...el, puntos: el.puntos.map(p => ({ x: p.x + dx, y: p.y + dy })) };
        }
        return { ...el, x: el.x + dx, y: el.y + dy };
      }));
      lastDragPos.current = coords;
    }

    if (modo === 'poligono' && puntosPoligono.length > 0) {
      setCursorCanvas(coords);
    }
  };

  const finalizarAccion = () => {
    if (dibujando) {
      setDibujando(false);
      if (Math.abs(nuevaArea.w) > 0.5 && Math.abs(nuevaArea.h) > 0.5) {
        setEditando({
          id: Date.now(), tipo: modo, ...nuevaArea,
          titulo: '', contenido: '', icono: modo === 'circulo' ? '◯' : '▭', subTipo: 'texto',
          quiz: { pregunta: '', opciones: ['Sí', 'No'], correcta: 0 },
        });
        setPasoEdicion(1);
      }
      setNuevaArea(null);
    }
    setArrastrandoId(null);
  };

  const finalizarPoligono = () => {
    if (puntosPoligono.length < 3) return;
    setEditando({
      id: Date.now(), tipo: 'poligono', puntos: [...puntosPoligono],
      titulo: '', contenido: '', icono: '⬡', subTipo: 'texto',
      quiz: { pregunta: '', opciones: ['Sí', 'No'], correcta: 0 },
    });
    setPasoEdicion(1);
    setPuntosPoligono([]);
    setCursorCanvas(null);
  };

  // ─── Guardado ────────────────────────────────────────────────────────────────
  const guardarElementoFinal = () => {
    const contenidoHTML = editando.subTipo === 'texto'
      ? (editorWysRef.current?.getHTML() || '')
      : (editando.contenido || '');

    const actualizado = { ...editando, contenido: contenidoHTML };
    setElementos(prev => {
      const existe = prev.some(el => el.id === editando.id);
      if (existe) return prev.map(el => el.id === editando.id ? actualizado : el);
      return [...prev, actualizado];
    });
    setEditando(null);
    setPasoEdicion(1);
  };

  const borrarElemento = (id) => {
    setElementos(prev => prev.filter(el => el.id !== id));
    setEditando(null);
    setPasoEdicion(1);
  };

  const guardarProyecto = () => {
    if (!imagenSrc) return alert('Sube una imagen primero');
    const nombre = window.prompt('Nombre del proyecto:');
    if (!nombre) return;
    const nuevo = { id: Date.now(), nombre, imagenSrc, elementos };
    const nuevoRepo = [...repositorio, nuevo];
    setRepositorio(nuevoRepo);
    localStorage.setItem('repositorio_chispas_final', JSON.stringify(nuevoRepo));
  };

  const borrarRepo = () => {
    if (window.confirm('¿Borrar todos los proyectos guardados?')) {
      localStorage.removeItem('repositorio_chispas_final');
      setRepositorio([]);
    }
  };

  // ─── Render de hotspot ───────────────────────────────────────────────────────
  const renderHotspot = (el) => {
    const onDown = (e) => {
      if (!esModoAlumno) {
        e.stopPropagation();
        setArrastrandoId(el.id);
        hasDragged.current = false;
        lastDragPos.current = coordsDeEvento(e);
      }
    };
    const onOpen = (e) => {
      if (hasDragged.current) { hasDragged.current = false; return; }
      e.stopPropagation();
      setEditando(el);
      setPasoEdicion(3);
      setRespuestaUsuario(null);
    };

    // Polígono — SVG
    if (el.tipo === 'poligono') {
      const cx = el.puntos.reduce((s, p) => s + p.x, 0) / el.puntos.length;
      const cy = el.puntos.reduce((s, p) => s + p.y, 0) / el.puntos.length;
      return (
        <React.Fragment key={el.id}>
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', zIndex: 10, pointerEvents: 'none' }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon
              points={el.puntos.map(p => `${p.x},${p.y}`).join(' ')}
              fill="rgba(3,174,210,0.15)"
              stroke={esModoAlumno ? 'transparent' : C.primary}
              strokeWidth="0.35"
              style={{ cursor: 'pointer', pointerEvents: 'all' }}
              onMouseDown={onDown}
              onTouchStart={onDown}
              onClick={onOpen}
            />
          </svg>
          <div style={{
            position: 'absolute', left: `${cx}%`, top: `${cy}%`,
            transform: 'translate(-50%,-50%)',
            fontSize: '20px', zIndex: 12, pointerEvents: 'none',
          }}>
            {el.subTipo === 'quiz' ? '❓' : el.icono}
          </div>
        </React.Fragment>
      );
    }

    // Pin, Rectángulo, Círculo — div
    const esPin  = el.tipo === 'pin';
    const esCirc = el.tipo === 'circulo';
    const esArea = !esPin && !esCirc; // rectangulo o area (compat.)

    return (
      <div
        key={el.id}
        onMouseDown={onDown}
        onTouchStart={onDown}
        onClick={onOpen}
        className={esPin ? 'chispa-interactiva' : ''}
        style={{
          position: 'absolute',
          left:   `${esPin ? el.x : (el.w > 0 ? el.x : el.x + el.w)}%`,
          top:    `${esPin ? el.y : (el.h > 0 ? el.y : el.y + el.h)}%`,
          width:  esPin ? '40px' : `${Math.abs(el.w)}%`,
          height: esPin ? '40px' : `${Math.abs(el.h)}%`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transform: esPin ? 'translate(-50%,-50%)' : 'none',
          borderRadius: esCirc ? '50%' : (esArea ? '6px' : '0'),
          border: !esPin ? `1.5px dashed ${esModoAlumno ? 'rgba(3,174,210,0.3)' : C.primary}` : 'none',
          backgroundColor: !esPin ? 'rgba(3,174,210,0.1)' : 'transparent',
          zIndex: 10,
          transition: 'background-color 0.2s',
        }}
      >
        {esPin && (
          <span style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))', lineHeight: 1 }}>
            {el.subTipo === 'quiz' ? '❓' : el.icono}
          </span>
        )}
        {!esPin && el.subTipo === 'quiz' && (
          <span style={{ fontSize: '20px', opacity: 0.7 }}>❓</span>
        )}
      </div>
    );
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui', backgroundColor: esModoAlumno ? C.white : C.bg, minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <header style={{
        backgroundColor: C.white, padding: '10px 20px', borderRadius: '14px', marginBottom: '14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
        boxShadow: `0 2px 16px rgba(3,174,210,0.12)`,
        position: 'sticky', top: '8px', zIndex: 100,
        border: `1px solid ${C.border}`,
      }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: C.primary, letterSpacing: '-0.3px' }}>
          ✨ {esModoAlumno ? 'Vista del alumno' : 'Lienzo con Chispas'}
        </h2>

        {!esModoAlumno && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Selector de modo */}
            <div style={{ display: 'flex', gap: '3px', background: C.bg, padding: '4px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
              {MODOS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setModo(m.id); setPuntosPoligono([]); setCursorCanvas(null); }}
                  title={m.titulo}
                  style={{
                    ...btn({ padding: '5px 10px', fontSize: '16px', borderRadius: '7px' }),
                    background: modo === m.id ? C.yellow : 'transparent',
                    border: modo === m.id ? `1.5px solid ${C.primary}` : '1.5px solid transparent',
                    color: C.text,
                  }}
                >{m.etiqueta}</button>
              ))}
            </div>

            {/* Subida de imagen */}
            <label style={{ ...btn({ padding: '7px 14px', fontSize: '13px', background: C.light, color: C.text, display: 'inline-flex', alignItems: 'center', gap: '5px' }), cursor: 'pointer' }}>
              🖼 Imagen
              <input
                type="file" accept="image/*"
                onChange={e => {
                  const f = e.target.files[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = ev => { setImagenSrc(ev.target.result); setElementos([]); };
                  r.readAsDataURL(f);
                }}
                style={{ display: 'none' }}
              />
            </label>

            <button onClick={guardarProyecto} style={{ ...btn({ padding: '7px 16px', fontSize: '13px', background: C.primary, color: C.white }) }}>
              💾 Guardar
            </button>
          </div>
        )}

        <button
          onClick={() => setEsModoAlumno(!esModoAlumno)}
          style={{ ...btn({ padding: '7px 18px', fontSize: '13px', background: esModoAlumno ? C.text : C.primary, color: C.white }) }}
        >
          {esModoAlumno ? '🏠 Editar' : '🚀 Modo Alumno'}
        </button>
      </header>

      {/* ── BANNER POLÍGONO EN PROGRESO ── */}
      {!esModoAlumno && modo === 'poligono' && (
        <div style={{
          background: C.yellow, border: `1px solid ${C.primary}`,
          borderRadius: '10px', padding: '9px 16px', marginBottom: '12px',
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: C.text,
        }}>
          <span>⬡ Polígono · <b>{puntosPoligono.length}</b> punto(s) — haz clic en la imagen para añadir</span>
          {puntosPoligono.length >= 3 && (
            <button onClick={finalizarPoligono} style={{ ...btn({ padding: '5px 14px', fontSize: '12px', background: C.primary, color: C.white }) }}>
              ✅ Cerrar polígono
            </button>
          )}
          {puntosPoligono.length > 0 && (
            <button
              onClick={() => { setPuntosPoligono([]); setCursorCanvas(null); }}
              style={{ ...btn({ padding: '5px 12px', fontSize: '12px', background: 'transparent', color: C.danger, border: `1px solid ${C.danger}` }) }}
            >✕ Cancelar</button>
          )}
        </div>
      )}

      {/* ── LAYOUT PRINCIPAL ── */}
      <div style={{ display: 'grid', gridTemplateColumns: esModoAlumno ? '1fr' : '1fr 270px', gap: '18px' }}>

        {/* CANVAS */}
        <div style={{
          background: C.white, borderRadius: '16px', overflow: 'hidden',
          boxShadow: esModoAlumno ? 'none' : `0 4px 24px rgba(3,174,210,0.1)`,
          border: `1px solid ${C.border}`,
        }}>
          <div
            ref={contenedorRef}
            onMouseDown={iniciarInteraccion}
            onMouseMove={manejarMovimiento}
            onMouseUp={finalizarAccion}
            onMouseLeave={finalizarAccion}
            onClick={manejarClickCanvas}
            onTouchStart={iniciarInteraccion}
            onTouchMove={manejarMovimiento}
            onTouchEnd={finalizarAccion}
            style={{ position: 'relative', cursor: esModoAlumno ? 'default' : 'crosshair', touchAction: 'none' }}
          >
            {imagenSrc ? (
              <img src={imagenSrc} style={{ width: '100%', display: 'block', pointerEvents: 'none' }} alt="Fondo" />
            ) : (
              <div style={{ height: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, gap: '10px' }}>
                <span style={{ fontSize: '52px' }}>🖼</span>
                <span style={{ fontSize: '15px' }}>Sube una imagen para empezar</span>
              </div>
            )}

            {/* Preview área / círculo */}
            {nuevaArea && (
              <div style={{
                position: 'absolute',
                border: `2px solid ${C.primary}`, backgroundColor: 'rgba(3,174,210,0.1)',
                left:   `${nuevaArea.w > 0 ? nuevaArea.x : nuevaArea.x + nuevaArea.w}%`,
                top:    `${nuevaArea.h > 0 ? nuevaArea.y : nuevaArea.y + nuevaArea.h}%`,
                width:  `${Math.abs(nuevaArea.w)}%`,
                height: `${Math.abs(nuevaArea.h)}%`,
                borderRadius: modo === 'circulo' ? '50%' : '6px',
                pointerEvents: 'none',
              }} />
            )}

            {/* Preview polígono en construcción */}
            {puntosPoligono.length > 0 && (
              <svg
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polyline
                  points={puntosPoligono.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none" stroke={C.primary} strokeWidth="0.4" strokeDasharray="1.5,0.8"
                />
                {cursorCanvas && puntosPoligono.length > 0 && (
                  <line
                    x1={puntosPoligono[puntosPoligono.length - 1].x}
                    y1={puntosPoligono[puntosPoligono.length - 1].y}
                    x2={cursorCanvas.x} y2={cursorCanvas.y}
                    stroke={C.primary} strokeWidth="0.25" strokeDasharray="0.8,0.8" opacity="0.5"
                  />
                )}
                {puntosPoligono.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="1" fill={C.primary} />
                ))}
              </svg>
            )}

            {/* Hotspots */}
            {elementos.map(el => renderHotspot(el))}
          </div>
        </div>

        {/* SIDEBAR */}
        {!esModoAlumno && (
          <aside style={{
            background: C.white, padding: '18px', borderRadius: '16px', height: 'fit-content',
            boxShadow: `0 2px 12px rgba(3,174,210,0.06)`, border: `1px solid ${C.border}`,
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', color: C.text, fontWeight: '600' }}>
              🗂 Proyectos <span style={{ color: C.muted, fontWeight: 400 }}>({repositorio.length})</span>
            </h3>
            {repositorio.length === 0 && (
              <p style={{ color: C.muted, fontSize: '13px', textAlign: 'center', padding: '16px 0', margin: 0 }}>
                Sin proyectos guardados
              </p>
            )}
            {repositorio.map(p => (
              <div
                key={p.id}
                onClick={() => { setImagenSrc(p.imagenSrc); setElementos(p.elementos); }}
                style={{
                  padding: '10px 12px', background: C.bg, borderRadius: '8px',
                  cursor: 'pointer', border: `1px solid ${C.border}`, marginBottom: '8px',
                  fontSize: '13px', color: C.text, display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'border-color 0.15s',
                }}
              >
                <span>📁</span> {p.nombre}
              </div>
            ))}
            {repositorio.length > 0 && (
              <button onClick={borrarRepo} style={{ ...btn({ padding: '5px', fontSize: '11px', color: C.danger, background: 'none', marginTop: '4px' }) }}>
                Borrar lista
              </button>
            )}
          </aside>
        )}
      </div>

      {/* ── MODAL CREACIÓN / EDICIÓN ── */}
      {editando && pasoEdicion !== 3 && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: C.white, padding: '28px', borderRadius: '20px', width: '500px', maxWidth: '100%', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>

            {pasoEdicion === 1 ? (
              /* PASO 1: elegir tipo */
              <div>
                <h3 style={{ marginTop: 0, marginBottom: '16px', color: C.text }}>¿Qué tipo de hotspot?</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { sub: 'texto', emoji: '📝', label: 'Texto libre',   desc: 'Texto, imágenes, vídeos' },
                    { sub: 'quiz',  emoji: '❓', label: 'Cuestionario', desc: 'Pregunta con opciones'   },
                  ].map(op => (
                    <button
                      key={op.sub}
                      onClick={() => { setEditando({...editando, subTipo: op.sub}); setPasoEdicion(2); }}
                      style={{ ...btn({ padding: '18px 12px', fontSize: '14px', background: C.bg, border: `1.5px solid ${C.border}`, color: C.text, borderRadius: '12px', textAlign: 'center', lineHeight: 1.4 }) }}
                    >
                      <div style={{ fontSize: '26px', marginBottom: '6px' }}>{op.emoji}</div>
                      <div style={{ fontWeight: '700' }}>{op.label}</div>
                      <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px', fontWeight: '400' }}>{op.desc}</div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setEditando(null)} style={{ ...btn({ color: C.muted, background: 'none', padding: '8px', fontSize: '13px', width: '100%' }) }}>
                  Cancelar
                </button>
              </div>
            ) : (
              /* PASO 2: formulario */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: C.text, fontSize: '16px' }}>
                    {editando.subTipo === 'quiz' ? '❓ Cuestionario' : '📝 Texto libre'}
                  </h3>
                  <button onClick={() => setPasoEdicion(1)} style={{ ...btn({ color: C.muted, background: 'none', fontSize: '12px', padding: '4px 8px' }) }}>
                    ← Cambiar tipo
                  </button>
                </div>

                {/* Título */}
                <input
                  placeholder="Título del hotspot (opcional)"
                  value={editando.titulo}
                  onChange={e => setEditando({...editando, titulo: e.target.value})}
                  style={{ width: '100%', padding: '9px 12px', marginBottom: '12px', borderRadius: '8px', border: `1px solid ${C.border}`, boxSizing: 'border-box', fontSize: '14px', outline: `2px solid transparent`, fontFamily: 'system-ui' }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e  => e.target.style.borderColor = C.border}
                />

                {/* Selector de icono (solo pins de texto) */}
                {editando.tipo === 'pin' && editando.subTipo === 'texto' && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', color: C.muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Icono del pin</label>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {ICONOS_PIN.map(ic => (
                        <button
                          key={ic}
                          onClick={() => setEditando({...editando, icono: ic})}
                          style={{
                            ...btn({ padding: '4px 6px', fontSize: '18px', borderRadius: '6px' }),
                            background: editando.icono === ic ? C.yellow : C.bg,
                            border: `1.5px solid ${editando.icono === ic ? C.primary : C.border}`,
                          }}
                        >{ic}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quiz */}
                {editando.subTipo === 'quiz' ? (
                  <div>
                    <input
                      placeholder="Escribe la pregunta..."
                      value={editando.quiz.pregunta}
                      onChange={e => setEditando({...editando, quiz: {...editando.quiz, pregunta: e.target.value}})}
                      style={{ width: '100%', padding: '9px 12px', marginBottom: '12px', borderRadius: '8px', border: `1px solid ${C.border}`, boxSizing: 'border-box', fontSize: '14px', outline: 'none', fontFamily: 'system-ui' }}
                    />
                    <p style={{ margin: '0 0 8px', fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Opciones — marca la respuesta correcta:</p>
                    {editando.quiz.opciones.map((op, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="radio" name="correcta"
                          checked={editando.quiz.correcta === idx}
                          onChange={() => setEditando({...editando, quiz: {...editando.quiz, correcta: idx}})}
                          style={{ accentColor: '#22c55e', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <input
                          value={op}
                          onChange={e => {
                            const ops = [...editando.quiz.opciones];
                            ops[idx] = e.target.value;
                            setEditando({...editando, quiz: {...editando.quiz, opciones: ops}});
                          }}
                          style={{ flex: 1, padding: '8px 10px', border: `1px solid ${editando.quiz.correcta === idx ? '#22c55e' : C.border}`, borderRadius: '6px', boxSizing: 'border-box', outline: 'none', fontFamily: 'system-ui' }}
                        />
                        {editando.quiz.opciones.length > 2 && (
                          <button
                            onClick={() => {
                              const ops = editando.quiz.opciones.filter((_, i) => i !== idx);
                              const correcta = editando.quiz.correcta >= ops.length ? 0 : editando.quiz.correcta;
                              setEditando({...editando, quiz: {...editando.quiz, opciones: ops, correcta}});
                            }}
                            style={{ ...btn({ color: C.danger, background: 'none', padding: '4px', fontSize: '14px', flexShrink: 0 }) }}
                          >✕</button>
                        )}
                      </div>
                    ))}
                    {editando.quiz.opciones.length < 5 && (
                      <button
                        onClick={() => setEditando({...editando, quiz: {...editando.quiz, opciones: [...editando.quiz.opciones, '']}})}
                        style={{ ...btn({ fontSize: '12px', color: C.primary, background: 'none', padding: '4px 0', marginBottom: '8px' }) }}
                      >+ Añadir opción</button>
                    )}
                  </div>
                ) : (
                  /* WYSIWYG */
                  <EditorWYSIWYG ref={editorWysRef} initialContent={editando.contenido} />
                )}

                <button
                  onClick={guardarElementoFinal}
                  style={{ ...btn({ width: '100%', padding: '12px', marginTop: '14px', background: C.primary, color: C.white, fontSize: '15px', borderRadius: '10px' }) }}
                >
                  Aceptar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL VISOR (paso 3) ── */}
      {pasoEdicion === 3 && editando && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}
          onClick={() => { setEditando(null); setPasoEdicion(1); }}
        >
          <div
            style={{ backgroundColor: C.white, padding: '32px', borderRadius: '24px', maxWidth: '600px', width: '100%', maxHeight: '88vh', overflowY: 'auto', boxSizing: 'border-box' }}
            onClick={e => e.stopPropagation()}
          >
            {editando.titulo && (
              <h2 style={{ marginTop: 0, color: C.text, fontSize: '21px', marginBottom: '16px', fontWeight: '700' }}>
                {editando.titulo}
              </h2>
            )}

            {editando.subTipo === 'quiz' ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '17px', color: C.text, marginBottom: '18px', lineHeight: '1.5' }}>{editando.quiz.pregunta}</p>
                {editando.quiz.opciones.map((op, idx) => (
                  <button
                    key={idx}
                    onClick={() => setRespuestaUsuario(idx)}
                    style={{
                      ...btn({ padding: '12px 16px', width: '100%', marginBottom: '8px', fontSize: '15px', textAlign: 'left', borderRadius: '10px' }),
                      background: respuestaUsuario === idx
                        ? (idx === editando.quiz.correcta ? '#dcfce7' : '#fee2e2')
                        : C.bg,
                      border: `1.5px solid ${
                        respuestaUsuario === idx
                          ? (idx === editando.quiz.correcta ? '#22c55e' : C.danger)
                          : C.border
                      }`,
                      color: C.text,
                    }}
                  >{op}</button>
                ))}
                {respuestaUsuario !== null && (
                  <p style={{ fontWeight: '700', marginTop: '14px', fontSize: '17px', color: respuestaUsuario === editando.quiz.correcta ? '#22c55e' : C.danger }}>
                    {respuestaUsuario === editando.quiz.correcta ? '✅ ¡Correcto!' : '❌ Incorrecto'}
                  </p>
                )}
              </div>
            ) : (
              <div
                style={{ fontSize: '15px', lineHeight: '1.7', color: C.text }}
                dangerouslySetInnerHTML={{ __html: sanitizar(editando.contenido) }}
              />
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {!esModoAlumno && (
                <>
                  <button onClick={() => setPasoEdicion(2)} style={{ ...btn({ padding: '10px 20px', background: C.primary, color: C.white, fontSize: '14px' }) }}>
                    ✏️ Editar
                  </button>
                  <button onClick={() => borrarElemento(editando.id)} style={{ ...btn({ padding: '10px 20px', background: C.danger, color: C.white, fontSize: '14px' }) }}>
                    🗑️ Borrar
                  </button>
                </>
              )}
              <button
                onClick={() => { setEditando(null); setPasoEdicion(1); }}
                style={{ ...btn({ padding: '10px 24px', background: C.bg, color: C.text, border: `1px solid ${C.border}`, fontSize: '14px' }) }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
