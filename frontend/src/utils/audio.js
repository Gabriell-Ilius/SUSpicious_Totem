// Utilitário de Áudio do SUSpicious Totem
// Contorna a política de autoplay de navegadores (Chrome/Edge/Safari/Firefox)

let sharedAudioCtx = null;
let audioUnlocked = false;

export const getAudioContext = () => {
  if (!sharedAudioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      sharedAudioCtx = new AudioContext();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().then(() => {
      audioUnlocked = true;
    }).catch(() => {});
  }
  return sharedAudioCtx;
};

// Desbloqueia o áudio com qualquer clique do usuário na tela
export const unlockAudio = () => {
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        audioUnlocked = true;
      });
    } else {
      audioUnlocked = true;
    }
  }
  return audioUnlocked;
};

if (typeof window !== 'undefined') {
  ['click', 'touchstart', 'keydown'].forEach(evt => {
    window.addEventListener(evt, () => {
      unlockAudio();
    }, { once: false, passive: true });
  });
}

/**
 * Toca o clássico Bip / Ding-Dong hospitalar e aeroportuário em 4 tons harmônicos
 */
export const playHospitalChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Sequência melódica: Dó (523Hz) -> Mi (659Hz) -> Sol (784Hz) -> Dó Agudo (1046Hz)
    const tones = [
      { freq: 523.25, time: now + 0.00, dur: 0.35, gain: 0.35 },
      { freq: 659.25, time: now + 0.18, dur: 0.35, gain: 0.40 },
      { freq: 783.99, time: now + 0.36, dur: 0.45, gain: 0.45 },
      { freq: 1046.50, time: now + 0.54, dur: 0.90, gain: 0.50 }
    ];

    tones.forEach(({ freq, time, dur, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Tipo de onda rica em harmônicos suaves
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Curva de envelope suave (ADSR)
      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(gain, time + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + dur);
    });

  } catch (e) {
    console.warn("Falha ao tocar chime hospitalar:", e);
  }
};

/**
 * Toca alerta sonoro de risco clínico / emergência
 */
export const playEmergencyAlert = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    [0, 0.25, 0.5, 0.75].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now + delay);
      osc.frequency.exponentialRampToValueAtTime(1320, now + delay + 0.18);

      gainNode.gain.setValueAtTime(0.3, now + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.23);
    });
  } catch (e) {
    console.warn("Falha ao tocar alerta de emergência:", e);
  }
};

/**
 * Sintetizador de voz (opcional para acessibilidade)
 */
export const speakChamada = (codigo, setor) => {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Espaça as letras para pronúncia clara (ex: "F A R - P 0 0 3")
    const codigoFormatado = codigo.split('').join(' ');
    const texto = `Senha ${codigoFormatado}. Dirija-se ao ${setor || 'Atendimento'}.`;

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Aguarda o chime terminar antes de falar
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 1200);
  } catch (e) {
    console.log("SpeechSynthesis não disponível", e);
  }
};
