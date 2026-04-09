import { useState, useRef, useCallback } from 'react';
import { MapPin, Square, Circle, Hexagon, ImagePlus, Save, Eye, EyeOff, Check, Download, Code2 } from 'lucide-react';
import PanelArbol        from './components/PanelArbol';
import PanelPropiedades  from './components/PanelPropiedades';
import CanvasEditor      from './components/CanvasEditor';
import VisorContenido    from './components/VisorContenido';
import { generarHTMLStandalone } from './utils/exportHTML';

// ─── Paleta de colores para hotspots ─────────────────────────────────────────
const PALETA = ['#03AED2','#9ED3DC','#FEFD99','#FF3737','#B7E778','#40DAB2','#BE6283','#ED7575'];

// ─── Herramientas ─────────────────────────────────────────────────────────────
const HERRAMIENTAS = [
  { id: 'pin',        Icon: MapPin,  titulo: 'Pin (clic)'              },
  { id: 'rectangulo', Icon: Square,  titulo: 'Rectángulo (arrastrar)'  },
  { id: 'circulo',    Icon: Circle,  titulo: 'Círculo (arrastrar)'     },
  { id: 'poligono',   Icon: Hexagon, titulo: 'Polígono (clic × punto)' },
];

// ─── Paleta UI ────────────────────────────────────────────────────────────────
const C = {
  primary: '#78C841', accent: '#B4E50D', warning: '#FF9B2F', danger: '#FB4141',
  bg: '#f2fae8', panelBg: '#f7fdf2', white: '#fff',
  text: '#1a1a2e', muted: '#6b7280', border: '#c8e8a0',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const defaultQuiz = () => ({
  tipo: 'multiple', pregunta: '',
  opciones: ['', '', '', ''], correctas: [],
  respuestaCorrecta: '', validar: false,
});

const nombreDefault = (tipo, n) => (
  { pin: 'Pin', rectangulo: 'Área', circulo: 'Círculo', poligono: 'Polígono', area: 'Área' }[tipo] ?? tipo
) + ` ${n}`;

const migrarElemento = (el, idx) => ({
  id: el.id ?? Date.now() + idx,
  tipo: el.tipo ?? 'pin',
  nombre: el.nombre ?? el.titulo ?? `Elemento ${idx + 1}`,
  color: el.color ?? PALETA[idx % PALETA.length],
  emoji: el.emoji ?? '💬',
  mostrarEmoji: el.mostrarEmoji ?? false,
  oculto: el.oculto ?? false,
  x: el.x, y: el.y, w: el.w, h: el.h, puntos: el.puntos,
  tipoContenido: el.subTipo === 'quiz' ? 'quiz' : (el.tipoContenido ?? 'texto'),
  contenido: el.contenido ?? '',
  quiz: el.quiz ? {
    tipo: 'multiple', pregunta: el.quiz.pregunta ?? '',
    opciones: el.quiz.opciones ?? ['', ''],
    correctas: typeof el.quiz.correcta === 'number' ? [el.quiz.correcta] : (el.quiz.correctas ?? []),
    respuestaCorrecta: el.quiz.respuestaCorrecta ?? '', validar: el.quiz.validar ?? false,
  } : defaultQuiz(),
});

const btn = (extra = {}) => ({
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  border: 'none', borderRadius: '7px', cursor: 'pointer',
  fontWeight: '600', fontFamily: 'system-ui', ...extra,
});

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const bg = toast.tipo === 'ok' ? '#22c55e' : toast.tipo === 'error' ? '#ef4444' : '#1a1a2e';
  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      background: bg, color: '#fff', padding: '11px 22px', borderRadius: '100px',
      fontSize: '13px', fontWeight: '600', zIndex: 1000,
      display: 'flex', alignItems: 'center', gap: '8px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      animation: 'slideUp 0.25s ease',
      whiteSpace: 'nowrap',
    }}>
      {toast.tipo === 'guardando' && (
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
      )}
      {toast.msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [imagenSrc,      setImagenSrc]      = useState(null);
  const [elementos,      setElementos]      = useState([]);
  const [elementoSelec,  setElementoSelec]  = useState(null);
  const [modo,           setModo]           = useState('pin');
  const [esModoPreview,  setEsModoPreview]  = useState(false);
  const [dibujando,      setDibujando]      = useState(false);
  const [nuevaArea,      setNuevaArea]      = useState(null);
  const [puntosPoligono, setPuntosPoligono] = useState([]);
  const [cursorCanvas,   setCursorCanvas]   = useState(null);
  const [repositorio,    setRepositorio]    = useState(() => {
    let repos = JSON.parse(localStorage.getItem('repositorio_chispas_v2') ?? 'null') ?? [];
    if (!repos.length) {
      const viejo = JSON.parse(localStorage.getItem('repositorio_chispas_final') ?? 'null') ?? [];
      if (viejo.length) repos = viejo.map(p => ({ ...p, elementos: (p.elementos ?? []).map(migrarElemento) }));
    }
    return repos;
  });
  const [hotspotVisor,   setHotspotVisor]   = useState(null);
  const [toast,          setToast]          = useState(null);
  const [modalGuardar,   setModalGuardar]   = useState(false);
  const [nombreGuardar,  setNombreGuardar]  = useState('');

  const contenedorRef = useRef(null);
  const editorWysRef  = useRef(null);
  const arrastrandoId = useRef(null);
  const lastDragPos   = useRef(null);
  const hasDragged    = useRef(false);
  const toastTimer    = useRef(null);

  // ─── Toast ────────────────────────────────────────────────────────────────
  const mostrarToast = useCallback((tipo, msg, duracion = 2500) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ tipo, msg });
    if (tipo !== 'guardando') {
      toastTimer.current = setTimeout(() => setToast(null), duracion);
    }
  }, []);

  // ─── WYSIWYG ──────────────────────────────────────────────────────────────
  const leerWYSIWYG = useCallback(() => {
    if (elementoSelec && editorWysRef.current) {
      const html = editorWysRef.current.getHTML();
      setElementos(prev => prev.map(el => el.id === elementoSelec ? { ...el, contenido: html } : el));
      return html;
    }
    return null;
  }, [elementoSelec]);

  const seleccionar = useCallback((nuevoId) => {
    leerWYSIWYG();
    setElementoSelec(nuevoId);
  }, [leerWYSIWYG]);

  // ─── CRUD elementos ───────────────────────────────────────────────────────
  const actualizarElemento = useCallback((id, cambios) => {
    setElementos(prev => prev.map(el => el.id === id ? { ...el, ...cambios } : el));
  }, []);

  const borrarElemento = useCallback((id) => {
    setElementos(prev => prev.filter(el => el.id !== id));
    setElementoSelec(prev => prev === id ? null : prev);
  }, []);

  const crearElemento = useCallback((datos) => {
    leerWYSIWYG();
    setElementos(prev => {
      const nuevo = {
        id: Date.now(),
        nombre: nombreDefault(datos.tipo, prev.length + 1),
        color: PALETA[prev.length % PALETA.length],
        tipoContenido: 'texto', contenido: '',
        quiz: defaultQuiz(),
        emoji: '💬', mostrarEmoji: false, oculto: false,
        ...datos,
      };
      setElementoSelec(nuevo.id);
      return [...prev, nuevo];
    });
  }, [leerWYSIWYG]);

  // ─── Coordenadas ──────────────────────────────────────────────────────────
  const obtenerCoordenadas = (cx, cy) => {
    const r = contenedorRef.current.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width) * 100, y: ((cy - r.top) / r.height) * 100 };
  };

  const coordsDeEvento = (e) => {
    if (e.touches?.length)        return obtenerCoordenadas(e.touches[0].clientX,        e.touches[0].clientY);
    if (e.changedTouches?.length) return obtenerCoordenadas(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    return obtenerCoordenadas(e.clientX, e.clientY);
  };

  // ─── Handlers canvas ──────────────────────────────────────────────────────
  const iniciarInteraccion = (e) => {
    if (!imagenSrc || esModoPreview || modo === 'poligono') return;
    const coords = coordsDeEvento(e);
    if (modo === 'pin') {
      crearElemento({ tipo: 'pin', x: coords.x, y: coords.y });
    } else {
      setDibujando(true);
      setNuevaArea({ x: coords.x, y: coords.y, w: 0, h: 0 });
    }
  };

  const manejarClickCanvas = (e) => {
    if (!imagenSrc || esModoPreview || modo !== 'poligono') return;
    if (hasDragged.current) { hasDragged.current = false; return; }
    setPuntosPoligono(prev => [...prev, coordsDeEvento(e)]);
  };

  const manejarMovimiento = (e) => {
    if (esModoPreview) return;
    const coords = coordsDeEvento(e);
    if (dibujando) {
      setNuevaArea(prev => ({ ...prev, w: coords.x - prev.x, h: coords.y - prev.y }));
    }
    if (arrastrandoId.current && lastDragPos.current) {
      const dx = coords.x - lastDragPos.current.x;
      const dy = coords.y - lastDragPos.current.y;
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) hasDragged.current = true;
      setElementos(prev => prev.map(el => {
        if (el.id !== arrastrandoId.current) return el;
        if (el.tipo === 'poligono') return { ...el, puntos: el.puntos.map(p => ({ x: p.x + dx, y: p.y + dy })) };
        return { ...el, x: el.x + dx, y: el.y + dy };
      }));
      lastDragPos.current = coords;
    }
    if (modo === 'poligono' && puntosPoligono.length > 0) setCursorCanvas(coords);
  };

  const finalizarAccion = () => {
    if (dibujando) {
      setDibujando(false);
      if (Math.abs(nuevaArea.w) > 0.5 && Math.abs(nuevaArea.h) > 0.5) {
        crearElemento({ tipo: modo, ...nuevaArea });
      }
      setNuevaArea(null);
    }
    arrastrandoId.current = null;
  };

  const finalizarPoligono = () => {
    if (puntosPoligono.length < 3) return;
    crearElemento({ tipo: 'poligono', puntos: [...puntosPoligono] });
    setPuntosPoligono([]);
    setCursorCanvas(null);
  };

  const onElementoMouseDown = (id, e) => {
    if (esModoPreview) return;
    e.stopPropagation();
    arrastrandoId.current = id;
    hasDragged.current    = false;
    lastDragPos.current   = coordsDeEvento(e);
  };

  const onElementoClick = (id, e) => {
    e.stopPropagation();
    if (hasDragged.current) { hasDragged.current = false; return; }
    if (esModoPreview) {
      const el = elementos.find(el => el.id === id);
      if (el) setHotspotVisor(el);
    } else {
      seleccionar(id);
    }
  };

  // ─── Proyectos ────────────────────────────────────────────────────────────
  const guardarProyecto = () => {
    if (!imagenSrc) { mostrarToast('error', 'Sube una imagen primero'); return; }
    setNombreGuardar('');
    setModalGuardar(true);
  };

  const confirmarGuardar = () => {
    if (!nombreGuardar.trim()) return;
    setModalGuardar(false);
    mostrarToast('guardando', 'Guardando…');

    setTimeout(() => {
      let elsFinales = elementos;
      if (elementoSelec && editorWysRef.current) {
        const html = editorWysRef.current.getHTML();
        elsFinales = elementos.map(el => el.id === elementoSelec ? { ...el, contenido: html } : el);
        setElementos(elsFinales);
      }
      const nuevo     = { id: Date.now(), nombre: nombreGuardar.trim(), imagenSrc, elementos: elsFinales };
      const nuevoRepo = [...repositorio, nuevo];
      setRepositorio(nuevoRepo);
      try {
        localStorage.setItem('repositorio_chispas_v2', JSON.stringify(nuevoRepo));
        mostrarToast('ok', '✅ Guardado correctamente');
      } catch {
        mostrarToast('error', 'Error: imagen demasiado grande para guardar', 4000);
      }
    }, 80);
  };

  const cargarProyecto = (p) => {
    leerWYSIWYG();
    setImagenSrc(p.imagenSrc);
    setElementos((p.elementos ?? []).map(migrarElemento));
    setElementoSelec(null);
  };

  const borrarRepo = () => {
    if (window.confirm('¿Borrar todos los proyectos guardados?')) {
      localStorage.removeItem('repositorio_chispas_v2');
      setRepositorio([]);
    }
  };

  const enterPreview = () => { leerWYSIWYG(); setEsModoPreview(true); setElementoSelec(null); };
  const exitPreview  = () => setEsModoPreview(false);

  const handleImageUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => { setImagenSrc(ev.target.result); setElementos([]); setElementoSelec(null); };
    r.readAsDataURL(f);
  };

  // ─── Exportar ─────────────────────────────────────────────────────────────
  const exportarHTML = useCallback(() => {
    if (!imagenSrc) { mostrarToast('error', 'Sube una imagen primero'); return; }
    mostrarToast('guardando', 'Generando HTML…');
    setTimeout(() => {
      try {
        const html = generarHTMLStandalone(imagenSrc, elementos);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = 'lienzo-interactivo.html'; a.click();
        URL.revokeObjectURL(url);
        mostrarToast('ok', '✅ HTML descargado');
      } catch {
        mostrarToast('error', 'Error al generar HTML');
      }
    }, 80);
  }, [imagenSrc, elementos, mostrarToast]);

  const copiarIframe = useCallback(() => {
    if (!imagenSrc) { mostrarToast('error', 'Sube una imagen primero'); return; }
    mostrarToast('guardando', 'Generando iframe…');
    setTimeout(() => {
      try {
        const html    = generarHTMLStandalone(imagenSrc, elementos);
        const enc     = btoa(unescape(encodeURIComponent(html)));
        const ifrCode = `<iframe src="data:text/html;base64,${enc}" width="100%" height="600" style="border:none;border-radius:8px" allowfullscreen loading="lazy"></iframe>`;
        navigator.clipboard.writeText(ifrCode)
          .then(() => mostrarToast('ok', '✅ Código iframe copiado'))
          .catch(() => mostrarToast('error', 'No se pudo copiar al portapapeles'));
      } catch {
        mostrarToast('error', 'Error al generar iframe');
      }
    }, 80);
  }, [imagenSrc, elementos, mostrarToast]);

  // ─────────────────────────────────────────────────────────────────────────
  const elementoActual = elementos.find(el => el.id === elementoSelec) ?? null;

  const canvasProps = {
    ref: contenedorRef,
    imagenSrc, elementos, elementoSeleccionado: elementoSelec, modo, esModoPreview,
    nuevaArea, puntosPoligono, cursorCanvas,
    onIniciarInteraccion: iniciarInteraccion,
    onMovimiento:         manejarMovimiento,
    onFinalizar:          finalizarAccion,
    onClickCanvas:        manejarClickCanvas,
    onElementoMouseDown,
    onElementoClick,
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: esModoPreview ? '#1a1a2e' : C.bg, fontFamily: 'system-ui' }}>

      {/* ── TOOLBAR ── */}
      <header style={{
        background: esModoPreview ? 'rgba(255,255,255,0.05)' : C.white,
        borderBottom: `1px solid ${esModoPreview ? 'rgba(255,255,255,0.1)' : C.border}`,
        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px',
        flexShrink: 0, flexWrap: 'wrap', zIndex: 50,
      }}>

        <span style={{ fontSize: '14px', fontWeight: '800', color: esModoPreview ? '#fff' : C.primary, letterSpacing: '-0.3px' }}>
          ✨ Lienzo con Chispas
        </span>

        {!esModoPreview && (
          <>
            <div style={{ width: '1px', height: '22px', background: C.border }} />

            <div style={{ display: 'flex', gap: '2px', background: C.bg, padding: '3px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
              {HERRAMIENTAS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => { setModo(tool.id); if (tool.id !== 'poligono') { setPuntosPoligono([]); setCursorCanvas(null); } }}
                  title={tool.titulo}
                  style={{
                    ...btn({ padding: '5px 10px', fontSize: '13px', borderRadius: '6px' }),
                    background: modo === tool.id ? C.accent : 'transparent',
                    border: `1.5px solid ${modo === tool.id ? C.primary : 'transparent'}`,
                    color: C.text,
                  }}
                >
                  <tool.Icon size={14} />
                </button>
              ))}
            </div>

            {modo === 'poligono' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: C.accent, borderRadius: '6px', border: `1px solid ${C.primary}`, fontSize: '12px', color: C.text }}>
                <Hexagon size={12} color={C.primary} />
                <span><b>{puntosPoligono.length}</b> punto(s)</span>
                {puntosPoligono.length >= 3 && (
                  <button onClick={finalizarPoligono} style={{ ...btn({ padding: '2px 8px', fontSize: '11px', background: C.primary, color: '#fff' }) }}>
                    <Check size={11} /> Cerrar
                  </button>
                )}
                {puntosPoligono.length > 0 && (
                  <button onClick={() => { setPuntosPoligono([]); setCursorCanvas(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger, fontSize: '13px', lineHeight: 1 }}>✕</button>
                )}
              </div>
            )}
          </>
        )}

        <div style={{ flex: 1 }} />

        {!esModoPreview ? (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <label style={{ ...btn({ padding: '6px 12px', fontSize: '12px', background: C.bg, color: C.text, border: `1px solid ${C.border}` }), cursor: 'pointer' }}>
              <ImagePlus size={14} /> Imagen
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            <button onClick={guardarProyecto} style={{ ...btn({ padding: '6px 13px', fontSize: '12px', background: C.primary, color: '#fff' }) }}>
              <Save size={13} /> Guardar
            </button>
            <button onClick={exportarHTML} title="Descargar HTML standalone" style={{ ...btn({ padding: '6px 10px', fontSize: '12px', background: C.bg, color: C.text, border: `1px solid ${C.border}` }) }}>
              <Download size={13} />
            </button>
            <button onClick={copiarIframe} title="Copiar código iframe" style={{ ...btn({ padding: '6px 10px', fontSize: '12px', background: C.bg, color: C.text, border: `1px solid ${C.border}` }) }}>
              <Code2 size={13} />
            </button>
            <button onClick={enterPreview} style={{ ...btn({ padding: '6px 13px', fontSize: '12px', background: C.text, color: '#fff' }) }}>
              <Eye size={13} /> Vista previa
            </button>
          </div>
        ) : (
          <button onClick={exitPreview} style={{ ...btn({ padding: '7px 16px', fontSize: '12px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }) }}>
            <EyeOff size={14} /> Salir de vista previa
          </button>
        )}
      </header>

      {/* ── CUERPO ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {!esModoPreview && (
          <PanelArbol
            elementos={elementos}
            elementoSeleccionado={elementoSelec}
            onSeleccionar={seleccionar}
            onBorrar={borrarElemento}
            repositorio={repositorio}
            onCargarProyecto={cargarProyecto}
            onBorrarRepo={borrarRepo}
          />
        )}

        <CanvasEditor {...canvasProps} />

        {!esModoPreview && (
          <PanelPropiedades
            elemento={elementoActual}
            onUpdate={cambios => actualizarElemento(elementoSelec, cambios)}
            onBorrar={() => borrarElemento(elementoSelec)}
            editorWysRef={editorWysRef}
            paleta={PALETA}
          />
        )}
      </div>

      {/* Visor popup (preview) */}
      {hotspotVisor && (
        <VisorContenido elemento={hotspotVisor} onClose={() => setHotspotVisor(null)} />
      )}

      {/* Toast */}
      <Toast toast={toast} />

      {/* Modal guardar */}
      {modalGuardar && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalGuardar(false)}
        >
          <div
            style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', borderTop: `4px solid ${C.primary}` }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={14} color={C.primary} /> Guardar proyecto
            </h3>
            <input
              autoFocus
              value={nombreGuardar}
              onChange={e => setNombreGuardar(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmarGuardar()}
              placeholder="Nombre del proyecto"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${C.border}`, fontSize: '14px', boxSizing: 'border-box', marginBottom: '16px', outline: 'none', fontFamily: 'system-ui' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalGuardar(false)}
                style={{ ...btn({ padding: '8px 16px', fontSize: '13px', background: 'none', border: `1px solid ${C.border}`, color: C.muted }) }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarGuardar}
                disabled={!nombreGuardar.trim()}
                style={{ ...btn({ padding: '8px 16px', fontSize: '13px', background: nombreGuardar.trim() ? C.primary : '#d1d5db', color: '#fff', cursor: nombreGuardar.trim() ? 'pointer' : 'not-allowed' }) }}
              >
                <Check size={13} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
