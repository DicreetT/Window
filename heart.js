// Arranque robusto: click/touch/tecla → crea AudioContext y sincroniza animación.
(function(){
  const heart  = document.getElementById('heart');
  const flower = document.getElementById('flower');
  const overlay = document.getElementById('enter');

  let started = false, beats = 0, timerId = null;

  function pulseOnce(){
    heart.classList.add('beat');
    setTimeout(()=> heart.classList.remove('beat'), 700);
    beats++;
    if (beats === 6) flower.classList.add('bloom');
  }

  function scheduleBeats(periodMs){
    pulseOnce(); // uno inmediato
    timerId = setInterval(pulseOnce, periodMs);
  }

  async function startWithAudio(){
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error('No AudioContext');

    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    // genera "lub-dub"
    const BPM = 75;
    const cycle = 60 / BPM; // s por latido (marcamos 2 pulsos dentro)

    function thump(time, delay, lowFreq, highFreq){
      const oscL = ctx.createOscillator();
      const gL = ctx.createGain();
      oscL.frequency.value = lowFreq; // 60 Hz
      gL.gain.setValueAtTime(0.0001, time + delay);
      gL.gain.exponentialRampToValueAtTime(0.6, time + delay + 0.01);
      gL.gain.exponentialRampToValueAtTime(0.0001, time + delay + 0.12);
      oscL.connect(gL).connect(master);
      oscL.start(time + delay);
      oscL.stop(time + delay + 0.25);

      const oscH = ctx.createOscillator();
      const gH = ctx.createGain();
      oscH.frequency.value = 320; // guiño nota "mi" ~ 329.63
      gH.gain.setValueAtTime(0.0001, time + delay);
      gH.gain.exponentialRampToValueAtTime(0.08, time + delay + 0.01);
      gH.gain.exponentialRampToValueAtTime(0.0001, time + delay + 0.08);
      oscH.connect(gH).connect(master);
      oscH.start(time + delay);
      oscH.stop(time + delay + 0.15);
    }

    function scheduleBeat(baseTime){
      thump(baseTime, 0.00, 60, 320); // lub
      thump(baseTime, 0.28, 60, 320); // dub
      // sincroniza animación con audio
      const delayMs = Math.max(0, (baseTime - ctx.currentTime) * 1000);
      setTimeout(pulseOnce, delayMs);
    }

    // primer latido + repetición
    let t = ctx.currentTime + 0.05;
    scheduleBeat(t);
    setInterval(() => {
      t += cycle;
      scheduleBeat(t);
    }, cycle * 1000);
  }

  async function startHeart(){
    if (started) return;
    started = true;
    overlay.classList.add('hidden');

    try {
      await startWithAudio();
    } catch (e) {
      // Fallback sin audio: mantener la magia en silencio
      scheduleBeats(800);
    }
  }

  // Exponer función global para onclick del overlay
  window.startHeart = startHeart;

  // Arranques alternativos por si el click no se registra (accesibilidad)
  window.addEventListener('touchstart', () => { startHeart(); }, { once:true });
  window.addEventListener('keydown',     () => { startHeart(); }, { once:true });
})();
