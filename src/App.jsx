import React, { useState, useRef, useEffect } from 'react';

export default function App() {
  const [imagenSrc, setImagenSrc] = useState(null);
  const [elementos, setElementos] = useState([]);
  const [modo, setModo] = useState('pin'); 
  const [esModoAlumno, setEsModoAlumno] = useState(false);
  const [dibujando, setDibujando] = useState(false);
  const [nuevaArea, setNuevaArea] = useState(null);
  const [editando, setEditando] = useState(null);
  const [pasoEdicion, setPasoEdicion] = useState(1);
  const [repositorio, setRepositorio] = useState([]);
  const [arrastrandoId, setArrastrandoId] = useState(null);
  const [respuestaUsuario, setRespuestaUsuario] = useState(null);
  
  const contenedorRef = useRef(null);

  // Cargar proyectos al encender la app
  useEffect(() => {
    const guardados = JSON.parse(localStorage.getItem("repositorio_chispas_final")) || [];
    setRepositorio(guardados);
  }, []);

  const manejarSubidaPrincipal = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onload = (ev) => { 
        setImagenSrc(ev.target.result); 
        setElementos([]); 
      };
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
    if (!imagenSrc || editando || arrastrandoId || esModoAlumno) return;
    const coords = obtenerCoordenadas(e);
    if (modo === 'pin') {
      setEditando({ 
        id: Date.now(), tipo: 'pin', x: coords.x, y: coords.y, 
        titulo: '', contenido: '', icono: '📍', subTipo: 'texto', 
        quiz: { pregunta: '', opciones: ['Si', 'No'], correcta: 0 } 
      });
      setPasoEdicion(1);
    } else {
      setDibujando(true);
      setNuevaArea({ x: coords.x, y: coords.y, w: 0, h: 0 });
    }
  };

  const manejarMovimiento = (e) => {
    if (esModoAlumno) return;
    const coords = obtenerCoordenadas(e);
    if (dibujando) setNuevaArea(prev => ({ ...prev, w: coords.x - prev.x, h: coords.y - prev.y }));
    if (arrastrandoId) {
      setElementos(prev => prev.map(el => el.id === arrastrandoId ? { ...el, x: coords.x, y: coords.y } : el ));
    }
  };

  const finalizarAccion = () => {
    if (dibujando) {
      setDibujando(false);
      if (Math.abs(nuevaArea.w) > 0.5) {
        setEditando({ 
          id: Date.now(), tipo: 'area', ...nuevaArea, 
          titulo: '', contenido: '', icono: '🔳', subTipo: 'texto', 
          quiz: { pregunta: '', opciones: ['Si', 'No'], correcta: 0 } 
        });
        setPasoEdicion(1);
      }
      setNuevaArea(null);
    }
    setArrastrandoId(null);
  };

  const guardarElementoFinal = () => {
    const editor = document.getElementById('editor-enriquecido');
    const contenidoHTML = editor ? editor.innerHTML : (editando.contenido || "");
    setElementos([...elementos, { ...editando, contenido: contenidoHTML }]);
    setEditando(null);
  };

  const guardarProyectoCompleto = () => {
    if (!imagenSrc) return alert("Sube una imagen primero");
    const nombre = prompt("Nombre para este proyecto:");
    if (!nombre) return;

    const nuevoProyecto = {
      id: Date.now(),
      nombre: nombre,
      imagenSrc: imagenSrc,
      elementos: elementos
    };

    const nuevoRepositorio = [...repositorio, nuevoProyecto];
    setRepositorio(nuevoRepositorio);
    localStorage.setItem("repositorio_chispas_final", JSON.stringify(nuevoRepositorio));
    alert("¡Proyecto guardado!");
  };

  const borrarTodoElRepo = () => {
    if(confirm("¿Borrar todos los proyectos?")) {
      localStorage.removeItem("repositorio_chispas_final");
      setRepositorio([]);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui', backgroundColor: esModoAlumno ? '#fff' : '#f8f9fa', minHeight: '100vh' }}>
      
      <header style={{ 
        backgroundColor: '#fff', padding: '15px 25px', borderRadius: '15px', marginBottom: '20px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <h2 style={{ margin: 0, color: esModoAlumno ? '#0070f3' : '#333' }}>
          {esModoAlumno ? '📖 Vista del Alumno' : '🛠️ Editor de Infografías'}
        </h2>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!esModoAlumno && (
            <>
              <select value={modo} onChange={(e) => setModo(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <option value="pin">📍 Poner Pin</option>
                <option value="area">🔳 Dibujar Área</option>
              </select>
              <input type="file" onChange={manejarSubidaPrincipal} style={{ fontSize: '13px' }} />
              <button onClick={guardarProyectoCompleto} style={{ padding: '10px 18px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>💾 Guardar</button>
            </>
          )}
          <button 
            onClick={() => setEsModoAlumno(!esModoAlumno)}
            style={{ 
              padding: '10px 20px', background: esModoAlumno ? '#333' : '#0070f3', 
              color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' 
            }}
          >
            {esModoAlumno ? '🏠 Volver a Editar' : '🚀 MODO ALUMNO'}
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: esModoAlumno ? '1fr' : '1fr 300px', gap: '25px' }}>
        
        <div style={{ position: 'relative', background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: esModoAlumno ? 'none' : '0 10px 40px rgba(0,0,0,0.1)' }}>
          <div 
            ref={contenedorRef} 
            onMouseDown={iniciarInteraccion} onMouseMove={manejarMovimiento} onMouseUp={finalizarAccion} onMouseLeave={finalizarAccion}
            style={{ position: 'relative', cursor: esModoAlumno ? 'default' : 'crosshair' }}
          >
            {imagenSrc ? (
              <img src={imagenSrc} style={{ width: '100%', display: 'block', pointerEvents: 'none' }} alt="Fondo" />
            ) : (
              <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>Sube una imagen.</div>
            )}
            
            {nuevaArea && (
              <div style={{ position: 'absolute', border: '2px solid #0070f3', backgroundColor: 'rgba(0, 112, 243, 0.1)', left: `${nuevaArea.w > 0 ? nuevaArea.x : nuevaArea.x + nuevaArea.w}%`, top: `${nuevaArea.h > 0 ? nuevaArea.y : nuevaArea.y + nuevaArea.h}%`, width: `${Math.abs(nuevaArea.w)}%`, height: `${Math.abs(nuevaArea.h)}%` }} />
            )}

            {elementos.map(el => (
              <div 
                key={el.id} 
                onMouseDown={(e) => { if(!esModoAlumno) { e.stopPropagation(); setArrastrandoId(el.id); } }} 
                onClick={(e) => { if (!arrastrandoId) { e.stopPropagation(); setEditando(el); setPasoEdicion(3); setRespuestaUsuario(null); } }} 
                style={{ 
                  position: 'absolute', 
                  left: `${el.tipo === 'pin' ? el.x : (el.w > 0 ? el.x : el.x + el.w)}%`, 
                  top: `${el.tipo === 'pin' ? el.y : (el.h > 0 ? el.y : el.y + el.h)}%`, 
                  width: el.tipo === 'pin' ? '40px' : `${Math.abs(el.w)}%`, 
                  height: el.tipo === 'pin' ? '40px' : `${Math.abs(el.h)}%`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', transform: el.tipo === 'pin' ? 'translate(-50%, -50%)' : 'none',
                  border: el.tipo === 'area' && !esModoAlumno ? '1px dashed #0070f3' : '1px solid transparent', 
                  backgroundColor: 'transparent', zIndex: 10, transition: '0.2s'
                }}
              >
                {el.tipo === 'pin' ? <span style={{fontSize: '30px'}}>{el.subTipo === 'quiz' ? '❓' : el.icono}</span> : null}
              </div>
            ))}
          </div>
        </div>

        {!esModoAlumno && (
          <aside style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: 'fit-content' }}>
            <h3 style={{ marginTop: 0 }}>🗂️ Mis Proyectos</h3>
            {repositorio.map(p => (
              <div key={p.id} onClick={() => { setImagenSrc(p.imagenSrc); setElementos(p.elementos); }} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', cursor: 'pointer', border: '1px solid #eee', marginBottom: '10px' }}>
                📁 {p.nombre}
              </div>
            ))}
            {repositorio.length > 0 && <button onClick={borrarTodoElRepo} style={{color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px'}}>Borrar lista</button>}
          </aside>
        )}
      </div>

      {editando && pasoEdicion !== 3 && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', width: '400px' }}>
            {pasoEdicion === 1 ? (
              <div style={{ textAlign: 'center' }}>
                <button onClick={() => { setEditando({...editando, subTipo: 'texto'}); setPasoEdicion(2); }} style={{ width: '100%', padding: '15px', marginBottom: '10px' }}>📝 Texto</button>
                <button onClick={() => { setEditando({...editando, subTipo: 'quiz'}); setPasoEdicion(2); }} style={{ width: '100%', padding: '15px', background: '#f39c12', color: 'white' }}>❓ Cuestionario</button>
                <button onClick={() => setEditando(null)} style={{ marginTop: '10px' }}>Cancelar</button>
              </div>
            ) : (
              <div>
                <input placeholder="Título" value={editando.titulo} onChange={e => setEditando({...editando, titulo: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
                {editando.subTipo === 'quiz' ? (
                  <input placeholder="Pregunta..." value={editando.quiz.pregunta} onChange={e => setEditando({...editando, quiz: {...editando.quiz, pregunta: e.target.value}})} style={{ width: '100%', padding: '10px' }} />
                ) : (
                  <div id="editor-enriquecido" contentEditable style={{ padding: '15px', minHeight: '100px', border: '1px solid #ddd', outline: 'none' }} />
                )}
                <button onClick={guardarElementoFinal} style={{ width: '100%', padding: '12px', marginTop: '10px', background: '#0070f3', color: '#fff' }}>Aceptar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {pasoEdicion === 3 && editando && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={() => {setEditando(null); setPasoEdicion(1);}}>
          <div style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '25px', maxWidth: '550px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{marginTop: 0}}>{editando.titulo || "Información"}</h2>
            {editando.subTipo === 'quiz' ? (
              <div style={{textAlign: 'center'}}>
                <p>{editando.quiz.pregunta}</p>
                {editando.quiz.opciones.map((op, idx) => (
                  <button key={idx} onClick={() => setRespuestaUsuario(idx)} style={{ padding: '10px', margin: '5px', width: '100%', backgroundColor: respuestaUsuario === idx ? (idx === editando.quiz.correcta ? '#d4edda' : '#f8d7da') : '#fff' }}>{op}</button>
                ))}
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: editando.contenido }} />
            )}
            <button onClick={() => {setEditando(null); setPasoEdicion(1);}} style={{ display: 'block', margin: '20px auto 0', padding: '10px 30px' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}