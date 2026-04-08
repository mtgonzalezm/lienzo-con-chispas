import React, { useState, useRef, useEffect } from 'react';

export default function App() {
  const [imagenSrc, setImagenSrc] = useState(null);
  const [elementos, setElementos] = useState([]);
  const [modo, setModo] = useState('pin'); // 'pin' o 'area'
  const [dibujando, setDibujando] = useState(false);
  const [nuevaArea, setNuevaArea] = useState(null);
  const [editando, setEditando] = useState(null);
  const [repositorio, setRepositorio] = useState([]);
  
  const contenedorRef = useRef(null);

  useEffect(() => {
    const guardados = JSON.parse(localStorage.getItem("lienzoChispas_v3")) || [];
    setRepositorio(guardados);
  }, []);

  const manejarSubida = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onload = (evento) => { setImagenSrc(evento.target.result); setElementos([]); };
      lector.readAsDataURL(archivo);
    }
  };

  const obtenerCoordenadas = (e) => {
    const rect = contenedorRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    };
  };

  const iniciarInteraccion = (e) => {
    if (!imagenSrc || editando) return;
    const coords = obtenerCoordenadas(e);

    if (modo === 'pin') {
      const nuevoPin = { id: Date.now(), tipo: 'pin', x: coords.x, y: coords.y, contenido: '', titulo: '', multimedia: '' };
      setEditando(nuevoPin);
    } else {
      setDibujando(true);
      setNuevaArea({ x: coords.x, y: coords.y, w: 0, h: 0 });
    }
  };

  const mientrasDibuja = (e) => {
    if (!dibujando || modo !== 'area') return;
    const coords = obtenerCoordenadas(e);
    setNuevaArea(prev => ({
      ...prev,
      w: coords.x - prev.x,
      h: coords.y - prev.y
    }));
  };

  const finalizarDibujo = () => {
    if (!dibujando) return;
    setDibujando(false);
    if (Math.abs(nuevaArea.w) > 1 && Math.abs(nuevaArea.h) > 1) {
      setEditando({ id: Date.now(), tipo: 'area', ...nuevaArea, contenido: '', titulo: '', multimedia: '' });
    }
    setNuevaArea(null);
  };

  const guardarElemento = (e) => {
    e.preventDefault();
    setElementos([...elementos, editando]);
    setEditando(null);
  };

  const guardarProyecto = () => {
    const nombre = prompt("Nombre del proyecto:");
    if (!nombre) return;
    const nuevoRepo = [...repositorio, { id: Date.now(), nombre, imagenSrc, elementos }];
    localStorage.setItem("lienzoChispas_v3", JSON.stringify(nuevoRepo));
    setRepositorio(nuevoRepo);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <h2 style={{ margin: 0 }}>✨ Lienzo con Chispas Pro</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setModo('pin')} style={{ padding: '8px 15px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: modo === 'pin' ? '#0070f3' : 'white', color: modo === 'pin' ? 'white' : 'black', cursor: 'pointer' }}>📍 Pin</button>
          <button onClick={() => setModo('area')} style={{ padding: '8px 15px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: modo === 'area' ? '#0070f3' : 'white', color: modo === 'area' ? 'white' : 'black', cursor: 'pointer' }}>🔲 Área</button>
          <input type="file" onChange={manejarSubida} style={{ fontSize: '12px' }} />
          <button onClick={guardarProyecto} style={{ padding: '8px 15px', borderRadius: '6px', border: 'none', backgroundColor: '#28a745', color: 'white', cursor: 'pointer' }}>💾 Guardar</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: '20px' }}>
        <div 
          ref={contenedorRef}
          onMouseDown={iniciarInteraccion}
          onMouseMove={mientrasDibuja}
          onMouseUp={finalizarDibujo}
          style={{ position: 'relative', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', cursor: modo === 'area' ? 'crosshair' : 'pointer', userSelect: 'none' }}
        >
          {imagenSrc ? (
            <img src={imagenSrc} style={{ width: '100%', display: 'block', pointerEvents: 'none' }} alt="Lienzo" />
          ) : (
            <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>Sube una imagen para empezar</div>
          )}

          {/* Dibujo de nueva área en tiempo real */}
          {nuevaArea && (
            <div style={{
              position: 'absolute', border: '2px dashed #0070f3', backgroundColor: 'rgba(0, 112, 243, 0.2)',
              left: `${nuevaArea.w > 0 ? nuevaArea.x : nuevaArea.x + nuevaArea.w}%`,
              top: `${nuevaArea.h > 0 ? nuevaArea.y : nuevaArea.y + nuevaArea.h}%`,
              width: `${Math.abs(nuevaArea.w)}%`,
              height: `${Math.abs(nuevaArea.h)}%`
            }} />
          )}

          {/* Elementos guardados */}
          {elementos.map(el => (
            <div key={el.id} title={el.titulo} style={{
              position: 'absolute',
              left: `${el.tipo === 'pin' ? el.x : (el.w > 0 ? el.x : el.x + el.w)}%`,
              top: `${el.tipo === 'pin' ? el.y : (el.h > 0 ? el.y : el.y + el.h)}%`,
              width: el.tipo === 'pin' ? '20px' : `${Math.abs(el.w)}%`,
              height: el.tipo === 'pin' ? '20px' : `${Math.abs(el.h)}%`,
              backgroundColor: el.tipo === 'pin' ? '#ff3b30' : 'rgba(255, 255, 255, 0.3)',
              border: el.tipo === 'pin' ? '2px solid white' : '2px solid yellow',
              borderRadius: el.tipo === 'pin' ? '50%' : '4px',
              transform: el.tipo === 'pin' ? 'translate(-50%, -50%)' : 'none',
              cursor: 'help',
              transition: 'transform 0.2s'
            }} 
            onClick={(e) => { e.stopPropagation(); alert(`${el.titulo}\n${el.contenido}`); }}
            />
          ))}
        </div>

        <aside style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h4 style={{ marginTop: 0 }}>Proyectos</h4>
          {repositorio.map(r => (
            <div key={r.id} onClick={() => { setImagenSrc(r.imagenSrc); setElementos(r.elementos); }} style={{ padding: '8px', borderBottom: '1px solid #eee', cursor: 'pointer', fontSize: '14px' }}>📁 {r.nombre}</div>
          ))}
        </aside>
      </div>

      {/* MODAL DE EDICIÓN PROFESIONAL */}
      {editando && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={guardarElemento} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', width: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0 }}>Configurar Interacción</h3>
            <input required placeholder="Título (ej: Info importante)" value={editando.titulo} onChange={e => setEditando({...editando, titulo: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
            <textarea placeholder="Descripción enriquecida o texto..." rows="4" value={editando.contenido} onChange={e => setEditando({...editando, contenido: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', resize: 'none' }} />
            <input placeholder="URL de Video o Enlace (opcional)" value={editando.multimedia} onChange={e => setEditando({...editando, multimedia: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Añadir al Lienzo</button>
              <button type="button" onClick={() => setEditando(null)} style={{ padding: '10px', backgroundColor: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}