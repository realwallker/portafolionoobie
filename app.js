/* Cosmic Vapes – gating sólido + tragamonedas mejorado + modal con badges + flashWinner */
(() => {
  'use strict';

  // --- Premios (peso 0: visibles pero NO sorteables) ---
  const prizes = [
    {label:'Siga participando',           key:'TRY',  weight:40, color:'#1f2937'},
    {label:'10% en tu siguiente compra',  key:'P10',  weight:22, color:'#22d3ee'},
    {label:'2DO a mitad de precio',       key:'H2',   weight:18, color:'#34d399'},
    {label:'30% en compra > $30',         key:'P30',  weight:12, color:'#fbbf24'},
    {label:'2x1 VAPE',                    key:'2x1',  weight:0,  color:'#9333ea'},
    {label:'VAPE GRATIS',                 key:'FREE', weight:0,  color:'#ef4444'}
  ];

  // --- DOM ---
  const followBtn  = document.getElementById('followBtn'); // <a href="https://instagram.com/sb.cosmicvapes" target="_blank">
  const gate       = document.querySelector('.gate');
  const game       = document.getElementById('game');
  const spinBtn    = document.getElementById('spinBtn');
  const limitMsg   = document.getElementById('limitMsg');
  const slotReel   = document.getElementById('slotReel');
  const resultCard = document.getElementById('resultCard');
  const prizeText  = document.getElementById('prizeText');
  const codeText   = document.getElementById('codeText');
  const expiryHint = document.getElementById('expiryHint');
  const copyBtn    = document.getElementById('copyBtn');

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

  // --- LocalStorage keys ---
  const LS_LAST_SPIN   = 'cv_lastSpin';
  const LS_FOLLOW_FLAG = 'cv_followIntent';

  // --- Utils ---
  const pad2 = (n)=>String(n).padStart(2,'0');
  const fmtDateStamp = (d) => `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}`; // para el CÓDIGO
  const fmtDisplay = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const rand = (n) => Math.floor(Math.random()*n);
  const easeOutC = (t) => 1 - Math.pow(1 - t, 3);

  // --- Gating ---
  const hasFollowIntent = () => !!localStorage.getItem(LS_FOLLOW_FLAG);

  function lockGame() {
    if (gate) gate.hidden = false;
    if (game) game.hidden = true;
    if (spinBtn) { spinBtn.disabled = true; spinBtn.setAttribute('aria-disabled','true'); }
    if (limitMsg) limitMsg.textContent = 'Sigue la cuenta para activar el giro.';
  }
  function unlockGame(){
    if (gate) gate.hidden = true;
    if (game) game.hidden = false;
    if (spinBtn) { spinBtn.disabled = false; spinBtn.removeAttribute('aria-disabled'); }
    updateSpinLimit();
  }
  function enforceGateOnLoad(){ hasFollowIntent() ? unlockGame() : lockGame(); }
  function maybeUnlockAfterFollow(){ if (hasFollowIntent()) unlockGame(); }

  // --- Límite 24h ---
  function updateSpinLimit(){
    const last = Number(localStorage.getItem(LS_LAST_SPIN) || 0);
    const diff = Date.now() - last;
    const day  = 24*60*60*1000;
    if (diff < day){
      const h = Math.floor((day-diff)/3600000);
      const m = Math.floor(((day-diff)%3600000)/60000);
      spinBtn.disabled = true;
      limitMsg.textContent = `Vuelve en ${h}h ${m}m.`;
    } else {
      spinBtn.disabled = false;
      limitMsg.textContent = 'Tienes 1 giro disponible.';
    }
  }

  // --- CTA seguir: solo marcamos intención; el <a> abre en nueva pestaña ---
  followBtn?.addEventListener('click', () => {
    try { localStorage.setItem(LS_FOLLOW_FLAG, String(Date.now())); } catch {}
    unlockGame();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) maybeUnlockAfterFollow(); });
  window.addEventListener('pageshow', maybeUnlockAfterFollow);

  // --- Tragamonedas vertical (altura dinámica para alinear siempre) ---
  let ITEM_H = 128;        // respaldo inicial
  const REPS = 8;

  function measureItemHeight(){
    const first = slotReel.firstElementChild;
    if (first) ITEM_H = first.getBoundingClientRect().height || ITEM_H;
  }

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
    measureItemHeight();
  }

  function highlightAtY(y){
    const k = Math.round(-y / ITEM_H); // índice del ítem centrado/visible
    [...slotReel.children].forEach(el => el.removeAttribute('data-active'));
    const el = slotReel.children[k];
    if (el) el.setAttribute('data-active','true');
  }

  function spinTo(index, onEnd){
    const kTarget = (REPS-1)*prizes.length + index;
    const targetY = -kTarget * ITEM_H;
    const startY  = 0;
    const duration= 1900 + Math.random()*350;
    const start   = performance.now();

    function frame(now){
      const t = Math.min(1, (now-start)/duration);
      const y = startY + (targetY - startY) * easeOutC(t);
      slotReel.style.transform = `translateY(${y}px)`;
      highlightAtY(y);
      if (t < 1) requestAnimationFrame(frame); else onEnd();
    }
    requestAnimationFrame(frame);
  }

  // Recalcular en resize/orientation
  let resizeTO;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => { buildReel(); }, 120);
  });

  // --- Sorteo (excluye pesos 0) ---
  const selectable = prizes.filter(p => p.weight > 0);
  function pickPrize(){
    const pool = selectable.flatMap(i => Array(i.weight).fill(i));
    return pool[rand(pool.length)];
  }

  // --- Flash del ganador ---
  function flashWinner(){
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = document.querySelector('#slotReel [data-active="true"]');
    if (!el) return;
    el.classList.add('slot-win');
    setTimeout(()=> el.classList.remove('slot-win'), 900);
  }

  // --- Resultado + Modal (badges y fecha local) ---
  function showResult(chosen){
    const now     = new Date();
    const dateKey = fmtDateStamp(now);              // para el código
    const randKey = Math.random().toString(36).slice(2,6).toUpperCase();
    const code    = `CV-${chosen.key}-${dateKey}-${randKey}`;
    const expires = new Date(now.getTime() + 24*60*60*1000);

    // Respaldo inline
    prizeText.textContent  = `Tu premio: ${chosen.label}`;
    codeText.textContent   = code;
    expiryHint.textContent = `Válido 24h. Expira: ${fmtDisplay(expires)}.`;
    resultCard.hidden = false;

    // Persistencia y límite
    localStorage.setItem(LS_LAST_SPIN, String(Date.now()));
    localStorage.setItem(`cv_code_${dateKey}`, JSON.stringify({code, ts:now.getTime(), exp:expires.getTime()}));
    updateSpinLimit();

    // Modal con badges
    modalTitle.textContent = 'Resultado del giro';
    if (chosen.key === 'TRY'){
      modalPrize.innerHTML = `<span class="modal__badge modal__badge--try">Vuelve en 24 horas</span><br>${chosen.label}`;
    } else {
      modalPrize.innerHTML = `<span class="modal__badge modal__badge--win">¡Ganaste!</span><br>${chosen.label}`;
    }
    modalCode.textContent  = code;
    document.getElementById('modalExpiry').textContent =
      `Toma una captura para canjearlo. Válido por 24h · expira ${fmtDisplay(expires)}.`;
    modal.hidden = false;

    const close = ()=> modal.hidden = true;
    modalOk.onclick = close;
    closeModal.onclick = close;
    modal.addEventListener('click', (e)=>{ if(e.target===modal) close(); }, {once:true});
    document.addEventListener('keydown', (e)=>{ if(!modal.hidden && e.key==='Escape') close(); }, {once:true});

    modalCopy.onclick = async () => {
      try{ await navigator.clipboard.writeText(code);
        modalCopy.textContent='Copiado ✓'; setTimeout(()=>modalCopy.textContent='Copiar',1500);
      }catch{}
    };

    // Confetti solo si ganó algo real (no TRY)
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      if (chosen.key !== 'TRY') shootConfetti();
    }
  }

  // --- Confetti ligero ---
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
      parts.forEach(p=>{
        p.y+=p.v; p.x+=Math.sin(p.a+=p.spin)*1.5;
        ctx.fillStyle=colors[p.s % colors.length];
        ctx.fillRect(p.x,p.y,p.s,p.s);
      });
      if(t<180) requestAnimationFrame(loop); else ctx.clearRect(0,0,w,h);
    })();
  }

  // --- Giro (con guard del gate y flashWinner) ---
  let spinning = false;
  spinBtn.addEventListener('click', () => {
    if (!hasFollowIntent()) { lockGame(); alert('Primero sigue la cuenta y vuelve para activar tu giro.'); return; }
    if (spinning) return;

    // Límite 24h
    const last = Number(localStorage.getItem(LS_LAST_SPIN) || 0);
    if (Date.now() - last < 24*60*60*1000){ updateSpinLimit(); return; }

    spinning = true; spinBtn.disabled = true;
    buildReel();
    const chosen = pickPrize();                        // nunca FREE/2x1
    const idx    = prizes.findIndex(p => p.key === chosen.key);

    spinTo(idx, () => {
      spinning = false;
      spinBtn.disabled = false;
      flashWinner();            // <— destello elegante del premio
      showResult(chosen);
    });
  });

  copyBtn.addEventListener('click', async () => {
    try{
      await navigator.clipboard.writeText(codeText.textContent);
      copyBtn.textContent = 'Copiado ✓';
      setTimeout(()=> copyBtn.textContent = 'Copiar', 1600);
    }catch{}
  });

  // --- Init ---
  buildReel();
  enforceGateOnLoad();

})();
