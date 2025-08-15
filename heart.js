// Genera un latido "lub-dub" con WebAudio y sincroniza la animacion del SVG
(() => {
  const heart  = document.getElementById('heart');
  const flower = document.getElementById('flower');
  const overlay = document.getElementById('enter');

  // Setup de AudioContext
  let ctx, master, started = false, beats = 0;
  const BPM = 75;                 // ~75 bpm
  const cycle = 60 / BPM;         // segundos por latido (por "lub-dub" haremos dos impulsos)

  function thump(time, delay, lowFreq, highFreq){
    // crea dos osciladores (grave y un toquecito agudo) con envolvente corta
    const oscL = ctx.createOscillator();
    const gainL = ctx.createGain();
    oscL.frequency.value = lowFreq; // 60 Hz
    gainL.gain.setValueAtTime(0.0001, time + delay);
    gainL.gain.exponentialRampToValueAtTime(0.6, time + delay + 0.01);
    gainL.gain.exponentialRampToValueAtTime(0.0001, time + delay + 0.12);
    oscL.connect(gainL).connect(master);
    oscL.start(time + delay);
    oscL.stop(time + delay + 0.25);

    const oscH = ctx.createOscillator();
    const gainH = ctx.createGain();
    oscH.frequency.value = highFreq; // ~320 Hz (guiño nota "mi")
    gainH.gain.setValueAtTime(0.0001, time + delay);
    gainH.gain.exponentialRampToValueAtTime(0.08, time + delay + 0.01);
    gainH.gain.exponentialRampToValueAtTime(0.0001, time + delay + 0.08);
    oscH.connect(gainH).connect(master);
    oscH.start(time + delay);
    oscH.stop(time + delay + 0.15);
  }

  function scheduleBeat(baseTime){
    // "lub" y "dub" dentro del mismo latido
    thump(baseTime, 0.00, 60, 320);
    thump(baseTime, 0.28, 60, 320);

    // dispara animacion visual sync
    setTimeout(() => {
      heart.classList.add('beat');
      setTimeout(() => heart.classList.remove('beat'), 700);
      beats++;
      if (beats === 6) flower.classList.add('bloom'); // florece luego de unos latidos
    }, Math.max(0, (baseTime - ctx.currentTime) * 1000));
  }

  function startAudio(){
    if (started) return;
    started = true;
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.9; // volumen general
      master.connect(ctx.destination);
    }
    overlay.classList.add('hidden');

    // primer latido inmediato y luego cada "cycle"
    let t = ctx.currentTime + 0.05;
    scheduleBeat(t);
    setInterval(() => {
      t += cycle;
      scheduleBeat(t);
    }, cycle * 1000);
  }

  // Intentar autoplay; si falla (iOS), pedir tap
  try {
    const tryCtx = new (window.AudioContext || window.webkitAudioContext)();
    // algunos navegadores requieren resume() tras gesto
    if (tryCtx.state === 'suspended') {
      overlay.classList.remove('hidden');
      overlay.addEventListener('click', () => { tryCtx.resume(); startAudio(); }, { once:true });
    } else {
      tryCtx.close();
      startAudio();
    }
  } catch {
    overlay.classList.remove('hidden');
    overlay.addEventListener('click', startAudio, { once:true });
  }
})();
