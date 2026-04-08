import React, { useState, useRef, useEffect } from 'react';

export default function App() {
  const [imagenSrc, setImagenSrc] = useState(null);
  const [puntos, setPuntos] = useState([]);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);
  const [repositorio, setRepositorio] = useState([]);
  const contenedorRef = useRef(null);

  // Cargar las imágenes guardadas al abrir la página
  useEffect(() => {
    const trabajosGuardados = JSON.parse(localStorage.getItem("lienzoRepositorio")) || [];
    setRepositorio(trabajosGuardados);
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

  const manejarClicImagen = (evento) => {
    if (!imagenSrc) return;

    const rect = contenedorRef.current.getBoundingClientRect();
    const x = evento.clientX - rect.left;
    const y = evento.clientY - rect.top;

    const opcion = prompt("¿Qué quieres añadir en esta chispa?\n1 = Texto\n2 = Imagen (URL)\n3 = Vídeo de YouTube (URL)", "1");
    if (!opcion) return;

    let tipo = "";
    let contenido = "";

    if (opcion === "1") {
      contenido = prompt("Escribe tu texto:");
      tipo = "texto";
    } else if (opcion === "2") {
      contenido = prompt("Pega el enlace de la imagen:");
      tipo = "imagen";
    } else if (opcion === "3") {
      let urlYoutube = prompt("Pega el enlace de YouTube:");
      if (urlYoutube) {
        let videoId = urlYoutube.split('v=')[1] || urlYoutube.split('/').pop();
        let ampersandPosition = videoId.indexOf('&');
        if (ampersandPosition !== -1) videoId = videoId.substring(0, ampersandPosition);
        contenido = "https://www.youtube.com/embed/" + videoId;
        tipo = "video";
      }
    }

    if (contenido) {
      setPuntos([...puntos, { id: Date.now(), x, y, tipo, contenido }]);
    }
  };

  // --- NUEVAS FUNCIONES DEL REPOSITORIO ---
  const guardarTrabajo = () => {
    if (!imagenSrc) {
      alert("Primero tienes que subir una imagen.");
      return;
    }
    const nombre = prompt("Ponle un nombre a este lienzo:", "Mi lienzo " + Math.floor(Math.random() * 100));
    if (!nombre) return;

    const nuevoTrabajo = { id: Date.now(), nombre, imagenSrc, puntos };
    const nuevoRepositorio = [...repositorio, nuevoTrabajo];
    
    try {
      localStorage.setItem("lienzoRepositorio", JSON.stringify(nuevoRepositorio));
      setRepositorio(nuevoRepositorio);
      alert("¡Lienzo guardado correctamente en tu repositorio!");
    } catch (error) {
      alert("Error al guardar. Es posible que la imagen sea demasiado pesada para la memoria del navegador.");
    }
  };

  const cargarTrabajo = (trabajo) => {
    setImagenSrc(trabajo.imagenSrc);
    setPuntos(trabajo.puntos);
  };

  const borrarRepositorio = () => {
    if (confirm("¿Seguro que quieres borrar todos tus lienzos guardados?")) {
      localStorage.removeItem("lienzoRepositorio");
      setRepositorio([]);
      setImagenSrc(null);
      setPuntos([]);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Cabecera y Controles */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h1 style={{ marginTop: 0 }}>✨ Lienzo con chispas ✨</h1>
        <p style={{ color: '#666' }}>1. Sube una imagen | 2. Haz clic para añadir chispas | 3. Guarda tu trabajo</p>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="file" accept="image/*" onChange={manejarSubida} style={{ padding: '10px', background: '#f0f0f0', borderRadius: '5px' }} />
          <button onClick={guardarTrabajo} style={{ padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            💾 Guardar Lienzo
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Zona del Lienzo */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <div 
            ref={contenedorRef}
            onClick={manejarClicImagen}
            style={{ 
              position: 'relative', display: 'inline-block', border: '3px dashed #ccc', borderRadius: '8px',
              minWidth: '100%', minHeight: '300px', cursor: imagenSrc ? 'crosshair' : 'default', backgroundColor: '#fafafa', overflow: 'hidden'
            }}
          >
            {!imagenSrc && <p style={{ textAlign: 'center', color: '#999', marginTop: '130px' }}>Tu lienzo está vacío. Sube una imagen para empezar.</p>}
            
            {imagenSrc && (
              <img src={imagenSrc} alt="Fondo interactivo" style={{ maxWidth: '100%', display: 'block' }} />
            )}

            {puntos.map((punto) => (
              <div
                key={punto.id}
                onClick={(e) => { e.stopPropagation(); setPuntoSeleccionado(punto); }}
                style={{
                  position: 'absolute', left: `${punto.x}px`, top: `${punto.y}px`, width: '24px', height: '24px',
                  backgroundColor: '#ff3b30', border: '2px solid white', borderRadius: '50%', transform: 'translate(-50%, -50%)',
                  cursor: 'pointer', boxShadow: '0px 2px 5px rgba(0,0,0,0.5)', zIndex: 10
                }}
              />
            ))}
          </div>
        </div>

        {/* Zona del Repositorio */}
        <div style={{ width: '300px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0 }}>🗂️ Mi Repositorio</h3>
          
          {repositorio.length === 0 ? (
            <p style={{ color: '#999', fontSize: '14px' }}>Aún no has guardado ningún lienzo.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {repositorio.map((trabajo) => (
                <div 
                  key={trabajo.id} 
                  onClick={() => cargarTrabajo(trabajo)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '5px', cursor: 'pointer', transition: '0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#007bff'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#eee'}
                >
                  <img src={trabajo.imagenSrc} alt={trabajo.nombre} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{trabajo.nombre}</span>
                </div>
              ))}
              <button onClick={borrarRepositorio} style={{ marginTop: '10px', padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                🗑️ Borrar Todo
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Modal para ver el contenido de las chispas */}
      {puntoSeleccionado && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', maxWidth: '600px', width: '90%', position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
            <button onClick={() => setPuntoSeleccionado(null)} style={{ position: 'absolute', top: '15px', right: '15px', cursor: 'pointer', background: '#f1f1f1', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold' }}>
              Cerrar ✕
            </button>
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              {puntoSeleccionado.tipo === 'texto' && <p style={{ fontSize: '20px', lineHeight: '1.5' }}>{puntoSeleccionado.contenido}</p>}
              {puntoSeleccionado.tipo === 'imagen' && <img src={puntoSeleccionado.contenido} style={{ maxWidth: '100%', borderRadius: '8px' }} alt="Contenido de la chispa" />}
              {puntoSeleccionado.tipo === 'video' && <iframe src={puntoSeleccionado.contenido} style={{ width: '100%', height: '350px', border: 'none', borderRadius: '8px' }} title="Video" allowFullScreen />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}