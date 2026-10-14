"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Square, Volume2 } from "lucide-react";

const subscribeNothing = () => () => {};

/** Prefiere una voz femenina en español (es-MX, luego es-ES, luego cualquier es). */
function pickVoice(): SpeechSynthesisVoice | null {
  const spanish = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("es"));
  if (spanish.length === 0) return null;
  const female = /sabina|paulina|helena|laura|monica|mónica|elena|dalia|female|femenin/i;
  for (const prefix of ["es-mx", "es-es", "es"]) {
    const group = spanish.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix));
    const match = group.find((v) => female.test(v.name)) ?? group[0];
    if (match) return match;
  }
  return spanish[0];
}

/** Lee en voz alta la ficha del Sommelier con la Web Speech API. */
export default function SommelierAudio({ text }: { text: string }) {
  const supported = useSyncExternalStore(
    subscribeNothing,
    () => "speechSynthesis" in window,
    () => false
  );
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Si el usuario sale de la página, el audio se detiene.
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!supported || !text.trim()) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    utterance.lang = voice?.lang ?? "es-MX";
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    setSpeaking(true);
    synth.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      aria-label={speaking ? "Detener la lectura del Sommelier" : "Escuchar la recomendación del Sommelier"}
      title={speaking ? "Detener" : "Escuchar"}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-black/70 transition-colors hover:bg-black/10 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {speaking ? <Square size={16} fill="currentColor" /> : <Volume2 size={18} />}
    </button>
  );
}
