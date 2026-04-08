import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const C = {
  primary: '#03AED2',
  border:  '#c8e8ee',
  bg:      '#eaf7fa',
};

function BtnTB({ children, onClick, titulo, activo }) {
  return (
    <button
      title={titulo}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      style={{
        padding: '3px 7px', minWidth: '28px', height: '26px',
        border: activo ? `1.5px solid ${C.primary}` : `1px solid ${C.border}`,
        borderRadius: '5px',
        background: activo ? 'rgba(3,174,210,0.12)' : '#fff',
        cursor: 'pointer', fontSize: '12px', fontWeight: '500',
        color: '#333', lineHeight: 1, fontFamily: 'system-ui',
      }}
    >{children}</button>
  );
}

const Sep = () => (
  <div style={{ width: '1px', height: '18px', background: C.border, margin: '0 3px', alignSelf: 'center' }} />
);

const EditorWYSIWYG = forwardRef(function EditorWYSIWYG({ initialContent }, ref) {
  const editorRef     = useRef(null);
  const [modoHTML, setModoHTML] = useState(false);
  const htmlRef       = useRef(initialContent || '');

  // Inicializar contenido al montar
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent || '';
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    getHTML() {
      if (modoHTML) return htmlRef.current;
      return editorRef.current?.innerHTML || '';
    },
  }));

  const cmd = (comando, valor = null) => {
    if (modoHTML) return;
    editorRef.current?.focus();
    document.execCommand(comando, false, valor);
  };

  const insertarLink = () => {
    const url = window.prompt('URL del enlace (ej: https://ejemplo.com):');
    if (url) cmd('createLink', url);
  };

  const insertarImagen = () => {
    const url = window.prompt('URL de la imagen:');
    if (url) cmd('insertImage', url);
  };

  const insertarMedia = () => {
    const url = window.prompt('URL del vídeo (YouTube, Vimeo…):');
    if (!url) return;
    // Convertir URL de YouTube a embed si es necesario
    const embedUrl = url
      .replace('watch?v=', 'embed/')
      .replace('youtu.be/', 'youtube.com/embed/');
    const iframe = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:8px 0"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe></div>`;
    cmd('insertHTML', iframe);
  };

  const toggleHTML = () => {
    if (!modoHTML) {
      htmlRef.current = editorRef.current?.innerHTML || '';
      setModoHTML(true);
    } else {
      if (editorRef.current) editorRef.current.innerHTML = htmlRef.current;
      setModoHTML(false);
    }
  };

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden' }}>
      {/* Barra de herramientas */}
      <div style={{
        display: 'flex', gap: '3px', padding: '6px 8px',
        background: '#f5f8fa', borderBottom: `1px solid ${C.border}`,
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        <BtnTB onClick={() => cmd('bold')}      titulo="Negrita (Ctrl+B)"><b>B</b></BtnTB>
        <BtnTB onClick={() => cmd('italic')}    titulo="Cursiva (Ctrl+I)"><i style={{fontFamily:'Georgia,serif'}}>I</i></BtnTB>
        <BtnTB onClick={() => cmd('underline')} titulo="Subrayado (Ctrl+U)"><u>U</u></BtnTB>
        <Sep />
        <BtnTB onClick={() => cmd('insertUnorderedList')} titulo="Lista con viñetas">• ≡</BtnTB>
        <BtnTB onClick={() => cmd('insertOrderedList')}   titulo="Lista numerada">1. ≡</BtnTB>
        <Sep />
        <BtnTB onClick={insertarLink}   titulo="Insertar enlace">🔗</BtnTB>
        <BtnTB onClick={insertarImagen} titulo="Insertar imagen por URL">🖼</BtnTB>
        <BtnTB onClick={insertarMedia}  titulo="Insertar vídeo / iframe">▶</BtnTB>
        <Sep />
        <BtnTB onClick={toggleHTML} titulo="Editar HTML directamente" activo={modoHTML}>&lt;/&gt;</BtnTB>
      </div>

      {/* Área de edición */}
      {modoHTML ? (
        <textarea
          defaultValue={htmlRef.current}
          onChange={e => { htmlRef.current = e.target.value; }}
          style={{
            width: '100%', minHeight: '150px', padding: '12px',
            border: 'none', outline: 'none', resize: 'vertical',
            fontFamily: 'monospace', fontSize: '12px',
            boxSizing: 'border-box', display: 'block',
            background: '#1a1a2e', color: '#9ED3DC',
          }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          style={{
            padding: '12px', minHeight: '150px',
            outline: 'none', fontSize: '14px',
            lineHeight: '1.65', color: '#1a1a2e',
          }}
        />
      )}
    </div>
  );
});

export default EditorWYSIWYG;
