/** A tiny generated click. There is no sound file in M1. */
export function playBlip(enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') {
    return;
  }
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }
  const context = sharedContext(AudioContextCtor);
  if (context.state === 'suspended') {
    void context.resume();
  }
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 660;
  gain.gain.value = 0.045;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.05);
}

let audioContext: AudioContext | null = null;

function sharedContext(ctor: typeof AudioContext): AudioContext {
  audioContext ??= new ctor();
  return audioContext;
}
