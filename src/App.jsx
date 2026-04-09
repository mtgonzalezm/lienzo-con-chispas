import { useState, useRef, useCallback } from 'react';
import { MapPin, Square, Circle, Hexagon, ImagePlus, Save, Eye, EyeOff, Check, Download, Code2 } from 'lucide-react';
import PanelArbol        from './components/PanelArbol';
import PanelPropiedades  from './components/PanelPropiedades';
import CanvasEditor      from './components/CanvasEditor';
import VisorContenido    from './components/VisorContenido';
import { generarHTMLStandalone } from './utils/exportHTML';
import './App.css';

const PALETA = ['#03AED2','#9ED3DC','#FEFD99','#FF3737','#B7E778','#40DAB2','#BE6283','#ED7575'];

const HERRAMIENTAS = [
  { id: 'pin',        Icon: MapPin,  titulo: 'Pin (clic)'              },
  { id: 'rectangulo', Icon: Square,  titulo: 'Rectángulo (arrastrar)'  },
  { id: 'circulo',    Icon: Circle,  titulo: 'Círculo (arrastrar)'     },
  { id: 'poligono',   Icon: Hexagon, titulo: 'Polígono (clic × punto)' },
];

const C = {
  green: '#78C841', lime: '#B4E50D', orange: '#FF9B2F', red: '#FB4141',
  white: '#ffffff', bg: '#ffffff', text: '#1a1a2e', muted: '#6b7280',
  border: '#e5e7eb', borderAccent: '#c8e8a0',
};

// ── Estilos de botón ──────────────────────────────────────────────────────────
const btnBase = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  border: 'none', borderRadius: '8px', cursor: 'pointer',
  fontFamily: "'Inter', sans-serif", fontWeight: '600', fontSize: '13px',
  transition: 'all 0.15s',
};
const btnPrimary  = { ...btnBase, background: C.green, color: '#fff', padding: '7px 15px' };
const btnGhost    = { ...btnBase, background: '#fff', color: C.text,  border: `1.5px solid ${C.border}`, padding: '6px 12px' };

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const bg = toast.tipo === 'ok' ? '#22c55e' : toast.tipo === 'error' ? C.red : C.text;
  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
      background: bg, color: '#fff', padding: '10px 24px', borderRadius: '100px',
      fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: '600',
      zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      animation: 'slideUp 0.22s ease', whiteSpace: 'nowrap',
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

  const mostrarToast = useCallback((tipo, msg, duracion = 2500) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ tipo, msg });
    if (tipo !== 'guardando') toastTimer.current = setTimeout(() => setToast(null), duracion);
  }, []);

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

  const obtenerCoordenadas = (cx, cy) => {
    const r = contenedorRef.current.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width) * 100, y: ((cy - r.top) / r.height) * 100 };
  };

  const coordsDeEvento = (e) => {
    if (e.touches?.length)        return obtenerCoordenadas(e.touches[0].clientX,        e.touches[0].clientY);
    if (e.changedTouches?.length) return obtenerCoordenadas(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    return obtenerCoordenadas(e.clientX, e.clientY);
  };

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
    if (dibujando) setNuevaArea(prev => ({ ...prev, w: coords.x - prev.x, h: coords.y - prev.y }));
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
      if (Math.abs(nuevaArea.w) > 0.5 && Math.abs(nuevaArea.h) > 0.5) crearElemento({ tipo: modo, ...nuevaArea });
      setNuevaArea(null);
    }
    arrastrandoId.current = null;
  };

  const finalizarPoligono = () => {
    if (puntosPoligono.length < 3) return;
    crearElemento({ tipo: 'poligono', puntos: [...puntosPoligono] });
    setPuntosPoligono([]); setCursorCanvas(null);
  };

  const onElementoMouseDown = (id, e) => {
    if (esModoPreview) return;
    e.stopPropagation();
    arrastrandoId.current = id; hasDragged.current = false;
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

  const guardarProyecto = () => {
    if (!imagenSrc) { mostrarToast('error', 'Sube una imagen primero'); return; }
    setNombreGuardar(''); setModalGuardar(true);
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
      const nuevoRepo = [...repositorio, { id: Date.now(), nombre: nombreGuardar.trim(), imagenSrc, elementos: elsFinales }];
      setRepositorio(nuevoRepo);
      try {
        localStorage.setItem('repositorio_chispas_v2', JSON.stringify(nuevoRepo));
        mostrarToast('ok', '✅ Guardado correctamente');
      } catch {
        mostrarToast('error', 'Error: imagen demasiado grande', 4000);
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
      } catch { mostrarToast('error', 'Error al generar HTML'); }
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
          .catch(() => mostrarToast('error', 'No se pudo copiar'));
      } catch { mostrarToast('error', 'Error al generar iframe'); }
    }, 80);
  }, [imagenSrc, elementos, mostrarToast]);

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
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: esModoPreview ? '#0f172a' : C.bg,
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ── TOOLBAR ── */}
      <header style={{
        background: esModoPreview ? 'rgba(15,23,42,0.95)' : C.white,
        borderBottom: `2px solid ${esModoPreview ? 'rgba(255,255,255,0.08)' : C.green}`,
        padding: '0 24px', height: '72px',
        display: 'flex', alignItems: 'center', gap: '14px',
        flexShrink: 0, flexWrap: 'nowrap', zIndex: 50,
        boxShadow: esModoPreview ? 'none' : `0 2px 12px rgba(120,200,65,0.18)`,
      }}>

        {/* Logo */}
        <span style={{
          fontFamily: "'Poppins', sans-serif", fontWeight: '700', fontSize: '36px',
          color: esModoPreview ? '#fff' : '#1a1a1a', letterSpacing: '-1px',
          whiteSpace: 'nowrap', lineHeight: 1,
        }}>
          ✨ Lienzo con Chispas
        </span>

        {!esModoPreview && (
          <>
            <div style={{ width: '1.5px', height: '28px', background: `${C.green}50`, flexShrink: 0 }} />

            {/* Herramientas */}
            <div style={{
              display: 'flex', gap: '3px',
              background: `${C.green}10`, padding: '4px', borderRadius: '10px',
              border: `1.5px solid ${C.green}40`,
            }}>
              {HERRAMIENTAS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => { setModo(tool.id); if (tool.id !== 'poligono') { setPuntosPoligono([]); setCursorCanvas(null); } }}
                  title={tool.titulo}
                  style={{
                    ...btnBase,
                    padding: '7px 13px', borderRadius: '7px', fontSize: '13px',
                    background: modo === tool.id ? C.green : 'transparent',
                    border: 'none',
                    color: modo === tool.id ? '#fff' : C.green,
                    boxShadow: modo === tool.id ? `0 3px 10px rgba(120,200,65,0.45)` : 'none',
                  }}
                >
                  <tool.Icon size={15} />
                </button>
              ))}
            </div>

            {/* Banner polígono */}
            {modo === 'poligono' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '5px 12px', background: '#f0fdf4',
                borderRadius: '8px', border: `1px solid ${C.green}44`,
                fontSize: '12px', color: C.text, fontFamily: "'Inter', sans-serif",
              }}>
                <Hexagon size={12} color={C.green} />
                <span style={{ fontWeight: '500' }}><b>{puntosPoligono.length}</b> punto(s)</span>
                {puntosPoligono.length >= 3 && (
                  <button
                    onClick={finalizarPoligono}
                    style={{ ...btnPrimary, padding: '3px 10px', fontSize: '11px' }}
                  >
                    <Check size={11} /> Cerrar
                  </button>
                )}
                {puntosPoligono.length > 0 && (
                  <button onClick={() => { setPuntosPoligono([]); setCursorCanvas(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: '14px', lineHeight: 1, padding: '2px' }}>✕</button>
                )}
              </div>
            )}
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Acciones */}
        {!esModoPreview ? (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <label style={{ ...btnGhost, cursor: 'pointer' }}>
              <ImagePlus size={14} /> Imagen
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            <button onClick={guardarProyecto} style={btnPrimary}>
              <Save size={13} /> Guardar
            </button>
            <button onClick={exportarHTML} title="Descargar HTML standalone" style={btnGhost}>
              <Download size={13} />
            </button>
            <button onClick={copiarIframe} title="Copiar código iframe" style={btnGhost}>
              <Code2 size={13} />
            </button>
            <button onClick={enterPreview} style={{ ...btnBase, background: C.text, color: '#fff', padding: '7px 15px' }}>
              <Eye size={13} /> Vista previa
            </button>
          </div>
        ) : (
          <button onClick={exitPreview} style={{
            ...btnBase,
            background: 'rgba(255,255,255,0.1)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)', padding: '7px 16px',
          }}>
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

      {hotspotVisor && (
        <VisorContenido elemento={hotspotVisor} onClose={() => setHotspotVisor(null)} />
      )}

      <Toast toast={toast} />

      {/* Modal guardar */}
      {modalGuardar && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setModalGuardar(false)}
        >
          <div
            style={{
              background: '#fff', padding: '28px 28px 24px', borderRadius: '16px',
              width: '380px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              borderTop: `4px solid ${C.green}`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{
              margin: '0 0 6px', fontFamily: "'Poppins', sans-serif",
              fontWeight: '700', fontSize: '17px', color: C.text,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Save size={16} color={C.green} /> Guardar proyecto
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: C.muted, fontFamily: "'Inter', sans-serif" }}>
              Ponle un nombre para encontrarlo fácilmente
            </p>
            <input
              autoFocus
              value={nombreGuardar}
              onChange={e => setNombreGuardar(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmarGuardar()}
              placeholder="Nombre del proyecto"
              style={{
                width: '100%', padding: '10px 13px', borderRadius: '9px',
                border: `1.5px solid ${C.border}`, fontSize: '14px',
                boxSizing: 'border-box', marginBottom: '18px', outline: 'none',
                fontFamily: "'Inter', sans-serif", transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = C.green; }}
              onBlur={e => { e.target.style.borderColor = C.border; }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalGuardar(false)} style={btnGhost}>
                Cancelar
              </button>
              <button
                onClick={confirmarGuardar}
                disabled={!nombreGuardar.trim()}
                style={{
                  ...btnPrimary,
                  opacity: nombreGuardar.trim() ? 1 : 0.45,
                  cursor: nombreGuardar.trim() ? 'pointer' : 'not-allowed',
                }}
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
