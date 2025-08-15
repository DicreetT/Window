// Genera un latido "lub-dub" con WebAudio y hace typing + reveal de la imagen.
// Si el navegador bloquea audio, el overlay "tap to enter" lo inicia.

let started = false;

function createHeartbeat(){
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);

  const BPM = 75;            // ~75 latidos por minuto
  const period = 60 / BPM;   // segundos por latido
  const baseFreq = 60;       // componente grave (thump)
  const clickFreq = 320;     // componente más aguda (guiño a "mi")

  function thump(time, delay){
    // grave
    const oscL = ctx.createOscillator();
    const gL = ctx.createGain();
    oscL.frequency.value = baseFreq;
    gL.gain.setValueAtTime(0.0001, time + delay);
    gL.gain.exponentialRampToValueAtTime(0.6, time + delay + 0.01);
    gL.gain.exponentialRampToValueAtTime(0.0001, time + delay + 0.12);
    oscL.connect(gL).connect(master);
    oscL.start(time + delay);
    oscL.stop(time + delay + 0.25);

    // agudo
    const oscH = ctx.createOscillator();
    const gH = ctx.createGain();
    oscH.frequency.value = clickFreq;
    gH.gain.setValueAtTime(0.0001, time + delay);
    gH.gain.exponentialRampToValueAtTime(0.08, time + delay + 0.01);
    gH.gain.exponentialRampToValueAtTime(0.0001, time + delay + 0.08);
    oscH.connect(gH).connect(master);
    oscH.start(time + delay);
    oscH.stop(time + delay + 0.15);
  }

  function scheduleBeat(t){
    thump(t, 0.00); // lub
    thump(t, 0.28); // dub
  }

  // programa latidos en loop
  let t = ctx.currentTime + 0.05;
  scheduleBeat(t);
  setInterval(() => { t += period; scheduleBeat(t); }, period * 1000);

  return ctx;
}

// Typing + reveal
function runTyping(){
  const target = document.getElementById('type');
  const cursor = document.querySelector('.cursor');
  const prize = document.getElementById('prize');
  const text = 'delicious Dom';
  let i = 0;
  const tick = setInterval(() => {
    target.textContent = text.slice(0, i++);
    if(i > text.length){
      clearInterval(tick);
      cursor.style.display = 'none';
      // mostrar imagen
      prize.classList.remove('hidden');
      requestAnimationFrame(() => prize.classList.add('show'));
    }
  }, 80);
}

async function startPrize(){
  if (started) return;
  started = true;
  document.getElementById('enter').classList.add('hidden');

  try {
    const ctx = createHeartbeat();
    // En algunos navegadores hay que "resume" tras gesto
    if (ctx.state === 'suspended') { await ctx.resume(); }
  } catch(e) {
    // Si falla el audio, igual seguimos con el typing + imagen
    console.warn('Audio no disponible, sigo en silencio', e);
  }

  runTyping();
}

// Arranques alternativos por accesibilidad
window.startPrize = startPrize;
window.addEventListener('keydown', startPrize, { once: true });
window.addEventListener('touchstart', startPrize, { once: true });
