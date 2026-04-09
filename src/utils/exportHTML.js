/**
 * Genera un HTML standalone e interactivo con los hotspots y quizzes.
 * No tiene dependencias externas.
 */
export function generarHTMLStandalone(imagenSrc, elementos) {
  const visibles  = elementos.filter(el => !el.oculto);
  const elsJSON   = JSON.stringify(visibles);

  // ── HTML de pins y áreas/círculos ────────────────────────────────────────
  const pinsYAreas = visibles
    .filter(el => el.tipo !== 'poligono')
    .map(el => {
      const color = el.color || '#03AED2';
      const emoji = el.emoji  || '💬';
      const op    = el.mostrarEmoji ? '1' : '0';

      if (el.tipo === 'pin') {
        return `<div class="hs pin" data-hs="${el.id}" style="left:${el.x}%;top:${el.y}%"><div class="pin-bub" style="background:${color}22;border:2px solid ${color};opacity:${op}">${emoji}</div></div>`;
      }

      const left = el.w >= 0 ? el.x : el.x + el.w;
      const top  = el.h >= 0 ? el.y : el.y + el.h;
      const w    = Math.abs(el.w);
      const h    = Math.abs(el.h);
      const r    = el.tipo === 'circulo' ? '50%' : '6px';

      return `<div class="hs area" data-hs="${el.id}" style="left:${left}%;top:${top}%;width:${w}%;height:${h}%;border-radius:${r};border:2px solid ${color}55"><span class="area-em" style="opacity:${op}">${emoji}</span></div>`;
    })
    .join('\n  ');

  // ── SVG de polígonos + emojis en centroide ───────────────────────────────
  const polys  = visibles.filter(el => el.tipo === 'poligono');
  const polySVG = polys.length === 0 ? '' :
    `<svg class="psv" viewBox="0 0 100 100" preserveAspectRatio="none">
    ${polys.map(el =>
      `<polygon data-poly="${el.id}" points="${el.puntos.map(p => `${p.x},${p.y}`).join(' ')}" fill="${el.color}18" stroke="${el.color}" stroke-width="0.4" style="cursor:pointer"/>`
    ).join('\n    ')}
  </svg>
  ${polys.map(el => {
    const cx = (el.puntos.reduce((s, p) => s + p.x, 0) / el.puntos.length).toFixed(2);
    const cy = (el.puntos.reduce((s, p) => s + p.y, 0) / el.puntos.length).toFixed(2);
    return `<span class="poly-em" data-pem="${el.id}" style="left:${cx}%;top:${cy}%;opacity:${el.mostrarEmoji ? '1' : '0'}">${el.emoji || '💬'}</span>`;
  }).join('\n  ')}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Lienzo con Chispas</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#1a1a2e;display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:20px;gap:12px}
.hdr{color:rgba(255,255,255,.45);font-size:11px;letter-spacing:1px;text-transform:uppercase}
#lienzo{position:relative;max-width:960px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 16px 60px rgba(0,0,0,.5)}
#lienzo>img{width:100%;display:block}
.hs{position:absolute;cursor:pointer;z-index:10}
.pin{transform:translate(-50%,-50%);width:44px;height:44px;display:flex;align-items:center;justify-content:center}
.pin-bub{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;transition:all .2s}
.pin:hover .pin-bub{opacity:1!important;transform:scale(1.15)}
.area{display:flex;align-items:center;justify-content:center;background:transparent;transition:background .2s}
.area:hover{background:rgba(255,255,255,.12)!important}
.area-em{font-size:20px;pointer-events:none;transition:opacity .2s}
.area:hover .area-em{opacity:1!important}
.psv{position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;z-index:9;pointer-events:none}
.psv polygon{cursor:pointer;pointer-events:all;transition:fill .2s}
.poly-em{position:absolute;transform:translate(-50%,-50%);font-size:20px;pointer-events:none;z-index:11;transition:opacity .2s}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99;cursor:pointer;backdrop-filter:blur(4px)}
.pop{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:16px;max-width:520px;width:90%;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.6);z-index:100}
.ph{padding:16px 18px 12px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:4px solid #78C841;flex-shrink:0}
.pt{font-size:15px;font-weight:700;color:#1a1a2e;display:flex;align-items:center;gap:8px}
.pc{background:#f3f4f6;border:none;border-radius:50%;width:26px;height:26px;cursor:pointer;font-size:13px;color:#6b7280;display:flex;align-items:center;justify-content:center}
.pc:hover{background:#e5e7eb}
.pb{padding:16px 18px 20px;overflow-y:auto}
.cont{font-size:14px;line-height:1.7;color:#1a1a2e}
.cont p{margin:0 0 8px}.cont h1,.cont h2,.cont h3{margin:12px 0 6px}.cont ul,.cont ol{padding-left:20px;margin:6px 0}.cont img{max-width:100%;border-radius:8px}.cont a{color:#78C841}
.quiz{display:flex;flex-direction:column;gap:9px}
.qp{font-size:14px;font-weight:600;color:#1a1a2e;line-height:1.5}
.qo{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;border:1.5px solid #e5e7eb;cursor:pointer;font-size:13px;color:#374151;transition:all .15s;user-select:none}
.qo:hover{border-color:#78C841;background:#f4faf0}
.qo.sel{border-color:#78C841;background:#f0fdf4;font-weight:600}
.qo.ok{border-color:#22c55e;background:#f0fdf4;color:#166534;cursor:default}
.qo.ko{border-color:#ef4444;background:#fef2f2;color:#991b1b;cursor:default}
.qo input{pointer-events:none;flex-shrink:0}
.qbtn{padding:9px 16px;border-radius:8px;border:none;background:#78C841;color:#fff;cursor:pointer;font-size:13px;font-weight:700;align-self:flex-start;transition:background .15s}
.qbtn:hover:not(:disabled){background:#5fa832}.qbtn:disabled{background:#d1d5db;cursor:not-allowed}
.qbtn.rt{background:#6b7280}.qbtn.rt:hover{background:#4b5563}
.qfb{padding:9px 12px;border-radius:8px;font-size:13px;font-weight:600}
.qfb.ok{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}
.qfb.ko{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
.qinp{width:100%;padding:9px;border-radius:8px;border:1.5px solid #e5e7eb;font-size:13px;outline:none;font-family:inherit}
.qinp:focus{border-color:#78C841}
.hint{font-size:11px;color:#9ca3af;text-align:center;padding-top:8px;border-top:1px solid #f3f4f6;margin-top:2px}
</style>
</head>
<body>
<p class="hdr">&#x2728; Lienzo con Chispas</p>
<div id="lienzo">
  <img src="${imagenSrc}" alt="Lienzo interactivo">
  ${pinsYAreas}
  ${polySVG}
</div>
<div id="ovl" class="ovl" style="display:none" onclick="cer()"></div>
<div id="pop" class="pop" style="display:none">
  <div class="ph" id="ph"><div class="pt" id="pt"></div><button class="pc" onclick="cer()">&#x2715;</button></div>
  <div class="pb" id="pb"></div>
</div>
<script>
var ELS=${elsJSON};
var S={},R={};
function init(){
  document.querySelectorAll('[data-hs]').forEach(function(d){d.addEventListener('click',function(){abr(+d.dataset.hs);});});
  document.querySelectorAll('[data-poly]').forEach(function(p){
    var id=+p.dataset.poly;
    var e=ELS.find(function(x){return x.id===id;});
    if(!e)return;
    p.addEventListener('click',function(){abr(id);});
    p.addEventListener('mouseenter',function(){p.style.fill=e.color+'35';var em=document.querySelector('[data-pem="'+id+'"]');if(em)em.style.opacity='1';});
    p.addEventListener('mouseleave',function(){p.style.fill=e.color+'18';var em=document.querySelector('[data-pem="'+id+'"]');if(em&&!e.mostrarEmoji)em.style.opacity='0';});
  });
}
function abr(id){
  var el=ELS.find(function(e){return e.id===id;});if(!el)return;
  if(!S[id])S[id]=[];if(R[id]===undefined)R[id]=false;
  document.getElementById('pop').style.display='flex';
  document.getElementById('ovl').style.display='block';
  document.getElementById('ph').style.borderTopColor=el.color;
  document.getElementById('pt').innerHTML='<span>'+(el.emoji||'💬')+'</span><span>'+esc(el.nombre)+'</span>';
  var b=document.getElementById('pb');
  if(el.tipoContenido==='texto'){b.innerHTML='<div class="cont">'+(el.contenido||'<p style="color:#9ca3af">Sin contenido</p>')+'</div>';}
  else{b.innerHTML=rQ(el);bnd(el);}
}
function cer(){document.getElementById('pop').style.display='none';document.getElementById('ovl').style.display='none';}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function bnd(el){var si=document.getElementById('si'+el.id);if(si)si.addEventListener('input',function(){S[el.id]=[this.value];});}
function rQ(el){
  var q=el.quiz||{};var resp=R[el.id];
  var h='<div class="quiz"><p class="qp">'+esc(q.pregunta||'Sin pregunta')+'</p>';
  if(q.tipo==='shortanswer'){
    if(resp){
      var v=(S[el.id]||[]).join('');
      var ok=!q.validar||v.toLowerCase().trim()===(q.respuestaCorrecta||'').toLowerCase().trim();
      h+='<div class="qfb '+(ok?'ok':'ko')+'">'+(ok?'&#x2705; Correcto!':'&#x274C; Incorrecto. Respuesta: '+esc(q.respuestaCorrecta||''))+'</div>';
      h+='<button class="qbtn rt" onclick="retry('+el.id+')">&#x21BA; Intentar de nuevo</button>';
    }else{
      h+='<input class="qinp" id="si'+el.id+'" placeholder="Tu respuesta..." value="'+esc((S[el.id]||[]).join(''))+'">';
      h+='<button class="qbtn" onclick="resp('+el.id+')" style="margin-top:6px">Comprobar</button>';
    }
  }else{
    var ops=q.opciones||[];
    for(var i=0;i<ops.length;i++){
      var cls='qo';
      if(resp){var esC=(q.correctas||[]).indexOf(i)>=0;var esMar=(S[el.id]||[]).indexOf(i)>=0;if(esMar&&esC)cls+=' ok';else if(esMar&&!esC)cls+=' ko';else if(esC)cls+=' ok';}
      else if((S[el.id]||[]).indexOf(i)>=0)cls+=' sel';
      var t=q.tipo==='checkboxes'?'checkbox':'radio';var chk=(S[el.id]||[]).indexOf(i)>=0?' checked':'';
      h+='<label class="'+cls+'" onclick="tog('+el.id+','+i+',"'+q.tipo+'")">'+'<input type="'+t+'"'+chk+' style="accent-color:'+el.color+'"><span>'+esc(ops[i])+'</span></label>';
    }
    if(!resp){
      h+='<button class="qbtn" onclick="resp('+el.id+')" '+((S[el.id]||[]).length?'':'disabled')+'>Comprobar</button>';
    }else{
      var corr=q.correctas||[];var sel2=S[el.id]||[];
      var allOk=corr.length===sel2.length&&corr.every(function(c){return sel2.indexOf(c)>=0;});
      h+='<div class="qfb '+(allOk?'ok':'ko')+'">'+(allOk?'&#x2705; Correcto!':'&#x274C; Respuesta incorrecta')+'</div>';
      h+='<button class="qbtn rt" onclick="retry('+el.id+')">&#x21BA; Intentar de nuevo</button>';
    }
  }
  h+='<p class="hint">&#x1F4A1; Explora la imagen para m&#xE1;s hotspots</p></div>';
  return h;
}
function tog(id,i,tipo){
  if(R[id])return;var sel=S[id]||[];
  if(tipo==='checkboxes')S[id]=sel.indexOf(i)>=0?sel.filter(function(x){return x!==i;}):[...sel,i];else S[id]=[i];
  var el=ELS.find(function(e){return e.id===id;});document.getElementById('pb').innerHTML=rQ(el);bnd(el);
}
function resp(id){R[id]=true;var el=ELS.find(function(e){return e.id===id;});document.getElementById('pb').innerHTML=rQ(el);bnd(el);}
function retry(id){R[id]=false;S[id]=[];var el=ELS.find(function(e){return e.id===id;});document.getElementById('pb').innerHTML=rQ(el);bnd(el);}
window.addEventListener('DOMContentLoaded',init);
</script>
</body>
</html>`;
}
