import React, { useState, useRef, useEffect } from 'react';
import './App.css';

export default function App() {
  const [imagenSrc, setImagenSrc] = useState(null);
  const [puntos, setPuntos] = useState([]);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);
  const [repositorio, setRepositorio] = useState([]);
  const contenedorRef = useRef(null);

  // Cargar repositorio al iniciar
  useEffect(() => {
    const guardados = JSON.parse(localStorage.getItem("lienzoChispasV2")) || [];
    setRepositorio(guardados);
  }, []);

  const manejarSubida = (evento) => {
    const archivo = evento.target.files[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onload = (e) => {
        setImagenSrc(e.target.result);
        setPuntos([]);
      };
      lector.readAsDataURL(archivo);
    }
  };

  const crearChispa = (evento) => {
    if (!imagenSrc) return;

    // Calculamos posición
    const rect = contenedorRef.current.getBoundingClientRect();
    const x = ((evento.clientX - rect.left) / rect.width) * 100; // Guardamos en % para que sea responsive
    const y = ((evento.clientY - rect.top) / rect.height) * 100;

    const tipo = prompt("¿Qué tipo de chispa quieres?\n1. Texto (📖)\n2. Enlace Web (🔗)\n3. Vídeo YouTube (🎬)", "1");
    if (!tipo) return;

    let contenido = "";
    let icono = "✨";

    if (tipo === "1") {
      contenido = prompt("Escribe el texto informativo:");
      icono = "📖";
    } else if (tipo === "2") {
      contenido = prompt("Pega la URL (ej: https://google.com):");
      icono = "🔗";
    } else if (tipo === "3") {
      let url = prompt("Pega el enlace de YouTube:");
      if (url) {
        let id = url.split('v=')[1] || url.split('/').pop();
        contenido = `https://www.youtube.com/embed/${id.split('&')[0]}`;
        icono = "🎬";
      }
    }

    if (contenido) {
      setPuntos([...puntos, { id: Date.now(), x, y, tipo, contenido, icono }]);
    }
  };

  const guardarEnLector = () => {
    if (!imagenSrc) return alert("Sube una imagen primero");
    const nombre = prompt("Nombre del proyecto:", "Nuevo Lienzo");
    const nuevoRepo = [...repositorio, { id: Date.now(), nombre, imagenSrc, puntos }];
    localStorage.setItem("lienzoChispasV2", JSON.stringify(nuevoRepo));
    setRepositorio(nuevoRepo);
    alert("¡Guardado!");
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#1a1a1a' }}>✨ Lienzo con Chispas Pro</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <input type="file" onChange={manejarSubida} style={{ padding: '10px', background: 'white', borderRadius: '8px' }} />
          <button onClick={guardarEnLector} style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Guardar Todo</button>
        </div>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        
        {/* AREA DE DIBUJO */}
        <div style={{ position: 'relative', backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <div 
            ref={contenedorRef} 
            onClick={crearChispa} 
            style={{ position: 'relative', cursor: imagenSrc ? 'crosshair' : 'default' }}
          >
            {imagenSrc ? (
              <img src={imagenSrc} style={{ width: '100%', display: 'block', pointerEvents: 'none' }} alt="Lienzo" />
            ) : (
              <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                Sube una imagen para empezar a crear
              </div>
            )}

            {puntos.map(p => (
              <div
                key={p.id}
                className="chispa-interactiva"
                onClick={(e) => { e.stopPropagation(); setPuntoSeleccionado(p); }}
                style={{
                  position: 'absolute',
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: '35px',
                  height: '35px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  zIndex: 20
                }}
              >
                {p.icono}
              </div>
            ))}
          </div>
        </div>

        {/* REPOSITORIO LATERAL */}
        <aside style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <h3>🗂️ Mis Proyectos</h3>
          {repositorio.map(item => (
            <div 
              key={item.id} 
              onClick={() => { setImagenSrc(item.imagenSrc); setPuntos(item.puntos); }}
              style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <img src={item.imagenSrc} style={{ width: '40px', height: '40px', borderRadius: '5px', objectFit: 'cover' }} />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.nombre}</span>
            </div>
          ))}
        </aside>
      </main>

      {/* VISOR DE CONTENIDO (MODAL) */}
      {puntoSeleccionado && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setPuntoSeleccionado(null)}
        >
          <div 
            style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', maxWidth: '600px', width: '90%', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setPuntoSeleccionado(null)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#eee', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
            
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              {puntoSeleccionado.tipo === "1" && <p style={{ fontSize: '1.2rem' }}>{puntoSeleccionado.contenido}</p>}
              {puntoSeleccionado.tipo === "2" && <a href={puntoSeleccionado.contenido} target="_blank" rel="noreferrer" style={{ color: '#0070f3', fontSize: '1.2rem' }}>Abrir enlace externo 🔗</a>}
              {puntoSeleccionado.tipo === "3" && <iframe src={puntoSeleccionado.contenido} style={{ width: '100%', height: '350px', border: 'none', borderRadius: '10px' }} allowFullScreen />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}