/* Cosmic Vapes – tragamonedas vertical con estética mejorada y selección segura */
(() => {
  'use strict';

  // Premios: los de weight 0 son visibles pero NO sorteables
  const prizes = [
    {label:'Siga participando',           key:'TRY',  weight:40, color:'#1f2937'},
    {label:'10% en tu siguiente compra',  key:'P10',  weight:22, color:'#22d3ee'},
    {label:'2DO a mitad de precio',       key:'H2',   weight:18, color:'#34d399'},
    {label:'30% en compra > $30',         key:'P30',  weight:12, color:'#fbbf24'},
    {label:'2x1 VAPE',                    key:'2x1',  weight:0,  color:'#9333ea'},
    {label:'VAPE GRATIS',                 key:'FREE', weight:0,  color:'#ef4444'}
  ];

  // UI
  const gateForm  = document.getElementById('gateForm');
  const game      = document.getElementById('game');
  const spinBtn   = document.getElementById('spinBtn');
  const limitMsg  = document.getElementById('limitMsg');
  const slotReel  = document.getElementById('slotReel');

  const resultCard= document.getElementById('resultCard');
  const prizeText = document.getElementById('prizeText');
  const codeText  = document.getElementById('codeText');
  const expiryHint= document.getElementById('expiryHint');
  const copyBtn   = document.getElementById('copyBtn');

  // Modal
  const modal      = document.getElementById('prizeModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalPrize = document.getElementById('modalPrize');
  const modalCode  = document.getElementById('modalCode');
  const modalCopy  = document.getElementById('modalCopy');
  const modalOk    = document.getElementById('modalOk');
  const closeModal = document.getElementById('closeModal');

  // Confetti
  const confettiCanvas = document.getElementById('confetti');

  const LS_LAST_SPIN = 'cv_lastSpin';
  const LS_USER      = 'cv_user';

  // Utils
  const fmtDate  = (d) => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const fmtTime  = (d) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  const rand     = (n) => Math.floor(Math.random()*n);
  const easeOutC = (t)=>1-Math.pow(1-t,3);

  // Selección con pesos (excluye explícitamente weight 0)
  const selectable = prizes.filter(p => p.weight > 0);
  function pickPrize(){
    const pool = selectable.flatMap(i => Array(i.weight).fill(i));
    return pool[rand(pool.length)];
  }

  // Gate
  gateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('igUser').value.trim();
    const ok   = document.getElementById('follows').checked;
    if(!user || !ok) return;
    localStorage.setItem(LS_USER, user);
    document.querySelector('.gate').hidden = true;
    game.hidden = false;
    updateSpinLimit();
  });

  function updateSpinLimit(){
    const last = Number(localStorage.getItem(LS_LAST_SPIN) || 0);
    const diff = Date.now() - last;
    const day  = 24*60*60*1000;
    if (diff < day){
      spinBtn.disabled = true;
      const h = Math.floor((day-diff)/3600000);
      const m = Math.floor(((day-diff)%3600000)/60000);
      limitMsg.textContent = `Vuelve en ${h}h ${m}m.`;
    } else {
      spinBtn.disabled = false;
      limitMsg.textContent = 'Tienes 1 giro disponible.';
    }
  }

  // Construir el carrete con N repeticiones y gradientes por color
  const ITEM_H = 148;
  const REPS   = 8;  // scroll más largo
  function buildReel(){
    const items = [];
    for (let r=0; r<REPS; r++){
      for (const p of prizes){
        const grad = `linear-gradient(180deg, ${p.color}, rgba(255,255,255,0.10))`;
        items.push(`<div class="slot-item" style="background:${grad}">${p.label}</div>`);
      }
    }
    slotReel.innerHTML = items.join('');
    slotReel.style.transform = 'translateY(0)';
  }

  // Animación: baja hasta el índice exacto del premio elegido
  function spinTo(index, onEnd){
    // índice absoluto en el carril: usamos el último set para que “viaje” bastante
    const kTarget = (REPS-1)*prizes.length + index;
    const targetY = -kTarget * ITEM_H;  // alineación perfecta con la línea central
    const startY  = 0;
    const duration= 2000 + Math.random()*350;
    const start   = performance.now();

    function highlight(y){
      const k = Math.round(-y / ITEM_H); // elemento centrado
      [...slotReel.children].forEach(el => el.removeAttribute('data-active'));
      const el = slotReel.children[k];
      if (el) el.setAttribute('data-active','true');
    }

    function frame(now){
      const t = Math.min(1, (now-start)/duration);
      const y = startY + (targetY - startY) * easeOutC(t);
      slotReel.style.transform = `translateY(${y}px)`;
      highlight(y);
      if (t < 1) requestAnimationFrame(frame); else onEnd();
    }
    requestAnimationFrame(frame);
  }

  // Mostrar resultado (más “ganaste”)
  function showResult(chosen){
    const now = new Date();
    const dateKey  = fmtDate(now);
    const randPart = Math.random().toString(36).slice(2,6).toUpperCase();
    const code     = `CV-${chosen.key}-${dateKey}-${randPart}`;
    const expires  = new Date(now.getTime() + 24*60*60*1000);

    // Tarjeta respaldo
    prizeText.textContent = `Tu premio: ${chosen.label}`;
    codeText.textContent  = code;
    expiryHint.textContent = `Válido por 24h. Expira: ${fmtDate(expires)} ${fmtTime(expires)}.`;
    resultCard.hidden = false;

    // Persistencia y bloqueo
    localStorage.setItem(LS_LAST_SPIN, String(Date.now()));
    localStorage.setItem(`cv_code_${dateKey}`, JSON.stringify({code, ts:now.getTime(), exp:expires.getTime()}));
    updateSpinLimit();

    // Modal enfocado en el “GANASTE”
    modalTitle.textContent = '¡GANASTE!';
    modalPrize.innerHTML   = `<span class="modal__badge">Premio del giro</span><br>${chosen.label}`;
    modalCode.textContent  = code;
    document.getElementById('modalExpiry').textContent =
      `Toma una captura para canjearlo. Válido por 24h · expira ${fmtDate(expires)} ${fmtTime(expires)}.`;
    modal.hidden = false;

    const close = ()=> modal.hidden = true;
    modalOk.onclick = close; closeModal.onclick = close;
    modal.addEventListener('click', (e)=>{ if(e.target===modal) close(); }, {once:true});
    document.addEventListener('keydown', (e)=>{ if(!modal.hidden && e.key==='Escape') close(); }, {once:true});

    modalCopy.onclick = async () => {
      try{ await navigator.clipboard.writeText(code); modalCopy.textContent='Copiado ✓'; setTimeout(()=>modalCopy.textContent='Copiar',1500); }catch{}
    };

    // Confetti solo si es premio real (no TRY)
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      if (chosen.key !== 'TRY') shootConfetti();
    }
  }

  // Confetti ligero
  function shootConfetti(){
    const ctx = confettiCanvas.getContext('2d');
    const {innerWidth:w, innerHeight:h} = window;
    confettiCanvas.width = w; confettiCanvas.height = h;
    const parts = Array.from({length:140}, () => ({
      x: Math.random()*w, y: -20 - Math.random()*h*0.2,
      s: 4 + Math.random()*4, v: 2 + Math.random()*3,
      a: Math.random()*Math.PI*2, spin:(Math.random()*2-1)*0.1
    }));
    const colors = ['#22d3ee','#34d399','#fbbf24','#e879f9','#60a5fa'];
    let t = 0;
    (function loop(){
      t++; ctx.clearRect(0,0,w,h);
      parts.forEach(p=>{ p.y+=p.v; p.x+=Math.sin(p.a+=p.spin)*1.5; ctx.fillStyle=colors[p.s % colors.length]; ctx.fillRect(p.x,p.y,p.s,p.s); });
      if(t<180) requestAnimationFrame(loop); else ctx.clearRect(0,0,w,h);
    })();
  }

  // Giro
  let spinning = false;
  spinBtn.addEventListener('click', () => {
    if (spinning) return;

    // límite 24h
    const last = Number(localStorage.getItem(LS_LAST_SPIN) || 0);
    if (Date.now() - last < 24*60*60*1000){ updateSpinLimit(); return; }

    spinning = true; spinBtn.disabled = true;
    buildReel();
    const chosen = pickPrize();                   // <-- NUNCA retorna pesos 0
    const chosenIndex = prizes.findIndex(p => p.key === chosen.key);

    spinTo(chosenIndex, () => {
      spinning = false;
      spinBtn.disabled = false;
      showResult(chosen);
    });
  });

  copyBtn.addEventListener('click', async () => {
    try{ await navigator.clipboard.writeText(codeText.textContent);
      copyBtn.textContent='Copiado ✓'; setTimeout(()=>copyBtn.textContent='Copiar',1600);
    }catch{}
  });

  // Init
  buildReel();
  updateSpinLimit();

})();
