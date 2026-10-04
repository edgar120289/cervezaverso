"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import { useChat } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, RotateCcw, SendHorizontal, ShoppingBag, X } from "lucide-react";
import { QUIZ_STEPS, type QuizAnswers } from "@/lib/data/sommelier-quiz";
import { useCart } from "@/lib/cart-context";
import { recommendProducts } from "@/app/actions/sommelier";
import type { Recommendation } from "@/lib/sommelier";
import type { Product } from "@/lib/types";
import MiniProductCard from "@/components/MiniProductCard";
import { SOMMELIER_MASCOT, SOMMELIER_NAME } from "@/lib/site";

type PartialAnswers = Partial<QuizAnswers>;

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Las cervezas que Graciela nombra en su texto van primero en el carrusel; el resto conserva su orden. */
function mentionedFirst<T extends { name: string }>(products: T[], text: string): T[] {
  const haystack = normalize(text);
  const mentioned = (p: T) => haystack.includes(normalize(p.name));
  return [...products.filter(mentioned), ...products.filter((p) => !mentioned(p))];
}

export default function SommelierModal({
  isOpen,
  focusInput,
  onClose,
}: {
  isOpen: boolean;
  focusInput: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PartialAnswers>({});
  const [draft, setDraft] = useState("");
  const [quizResults, setQuizResults] = useState<Recommendation[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const { messages, sendMessage, setMessages, status, error, stop } = useChat();
  const { openDrawer, itemCount } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const current = QUIZ_STEPS[step];
  const hasChat = messages.length > 0 || quizResults !== null || quizLoading;
  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !focusInput) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(id);
  }, [isOpen, focusInput]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  function handleAnswer(id: string) {
    const next = { ...answers, [current.key]: id } as PartialAnswers;
    setAnswers(next);
    if (step + 1 < QUIZ_STEPS.length) {
      setStep(step + 1);
      return;
    }
    // El quiz no pasa por la IA: cruce directo con el catálogo activo, sin texto.
    setQuizLoading(true);
    recommendProducts(next as QuizAnswers)
      .then(setQuizResults)
      .catch(() => setQuizResults([]))
      .finally(() => setQuizLoading(false));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isBusy) return;
    setDraft("");
    void sendMessage({ text });
  }

  function restart() {
    void stop();
    setMessages([]);
    setQuizResults(null);
    setStep(0);
    setAnswers({});
  }

  const linkClass = "font-semibold text-accent underline underline-offset-2";
  const markdownComponents: Components = {
    a: ({ href, children }) =>
      href?.startsWith("/") ? (
        <Link href={href} onClick={onClose} className={linkClass}>
          {children}
        </Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {children}
        </a>
      ),
    p: ({ children }) => <p className="[&:not(:first-child)]:mt-2">{children}</p>,
    ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5">{children}</ol>,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${SOMMELIER_NAME}, Sommelier de Cervezaverso: descubre tu cerveza ideal`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[calc(100dvh-2rem)] min-h-[min(34rem,calc(100dvh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-white shadow-card"
          >
            <div className="flex items-center justify-between gap-3 px-6 pb-3 pt-5 sm:px-8">
              {step > 0 && !hasChat ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-black"
                >
                  <ArrowLeft size={16} /> Atrás
                </button>
              ) : (
                <span className="flex items-center gap-2 text-sm font-semibold text-accent">
                  <Image src={SOMMELIER_MASCOT} alt="" width={28} height={34} className="h-8 w-auto" />
                  {SOMMELIER_NAME} · Sommelier Cervezaverso
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="scrollbar-none flex-1 overflow-y-auto px-6 pb-4 sm:px-8">
              {!hasChat ? (
                <>
                  <div className="mb-6 flex gap-1.5" aria-label={`Pregunta ${step + 1} de ${QUIZ_STEPS.length}`}>
                    {QUIZ_STEPS.map((s, i) => (
                      <span key={s.key} className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
                        <motion.span
                          className="block h-full rounded-full bg-accent"
                          initial={false}
                          animate={{ width: i < step ? "100%" : i === step ? "35%" : "0%" }}
                          transition={{ duration: 0.3 }}
                        />
                      </span>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current.key}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.22 }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Pregunta {step + 1} de {QUIZ_STEPS.length}
                      </p>
                      <h3 className="mb-5 mt-1 text-2xl font-semibold tracking-[-0.035em]">{current.question}</h3>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {current.options.map((option) => {
                          const selected = answers[current.key] === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleAnswer(option.id)}
                              className={`group flex items-center gap-3 rounded-[20px] px-4 py-3.5 text-left transition-colors ${
                                selected ? "bg-black text-white" : "bg-canvas hover:bg-black hover:text-white"
                              }`}
                            >
                              <span className="text-2xl" aria-hidden>
                                {option.emoji}
                              </span>
                              <span className="min-w-0">
                                <span className="block font-semibold leading-tight">{option.label}</span>
                                <span
                                  className={`block text-xs ${selected ? "text-white/60" : "text-muted group-hover:text-white/60"}`}
                                >
                                  {option.hint}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </>
              ) : (
                <div className="space-y-3" role="log" aria-live="polite" aria-label={`Conversación con ${SOMMELIER_NAME}`}>
                  {quizLoading && (
                    <p role="status" className="flex items-center gap-2 text-xs font-semibold text-muted">
                      <Loader2 size={14} className="animate-spin" /> Buscando en el catálogo…
                    </p>
                  )}
                  {quizResults && (
                    <div className="space-y-2">
                      {quizResults.length === 0 ? (
                        <p className="w-fit rounded-[20px] rounded-bl-md bg-canvas px-4 py-3 text-sm">
                          No encontré cervezas disponibles con ese perfil. Prueba con otra combinación o escríbeme abajo.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {quizResults.map(({ product }) => (
                            <li key={product.sku}>
                              <MiniProductCard product={product} onSelect={onClose} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {messages.map((message) => {
                    const text = message.parts.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("");
                    if (message.role === "user") {
                      return (
                        <p
                          key={message.id}
                          className="ml-auto w-fit max-w-[85%] rounded-[20px] rounded-br-md bg-black px-4 py-2.5 text-sm text-white"
                        >
                          {text}
                        </p>
                      );
                    }
                    const found = mentionedFirst(
                      message.parts.flatMap((part) =>
                        part.type === "tool-buscarCervezas" && part.state === "output-available"
                          ? (part.output as Omit<Product, "cost_price">[])
                          : []
                      ),
                      text
                    );
                    if (!text && found.length === 0) return null;
                    return (
                      <div key={message.id} className="mr-auto w-full max-w-[92%] space-y-3">
                        {text && (
                          <div className="w-fit rounded-[20px] rounded-bl-md bg-canvas px-4 py-3 text-sm leading-relaxed">
                            <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
                          </div>
                        )}
                        {found.length > 0 && (
                          <ul className="scrollbar-none -mx-1 flex max-w-full snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
                            {found.map((product) => (
                              <li key={product.sku} className="w-[17.5rem] max-w-[85%] shrink-0 snap-start">
                                <MiniProductCard product={{ ...product, cost_price: 0 }} onSelect={onClose} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                  {isBusy && (
                    <p role="status" className="flex items-center gap-2 text-xs font-semibold text-muted">
                      <Loader2 size={14} className="animate-spin" /> {SOMMELIER_NAME} está buscando en el catálogo…
                    </p>
                  )}
                  {error && (
                    <p role="alert" className="rounded-[20px] bg-canvas px-4 py-3 text-sm text-muted">
                      No pude responderte ahora mismo. Intenta de nuevo en unos minutos.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={restart}
                      className="flex items-center gap-1.5 rounded-full bg-black/5 px-4 py-2 text-xs font-semibold hover:bg-black/10"
                    >
                      <RotateCcw size={13} /> Nueva conversación
                    </button>
                    {itemCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          openDrawer();
                        }}
                        className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white"
                      >
                        <ShoppingBag size={13} /> Ver carrito ({itemCount})
                      </button>
                    )}
                  </div>
                  <div ref={endRef} />
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-black/5 px-4 py-3 sm:px-6">
              <label htmlFor="sommelier-input" className="sr-only">
                Escríbele a {SOMMELIER_NAME}
              </label>
              <input
                id="sommelier-input"
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={500}
                autoComplete="off"
                placeholder={`Escríbele a ${SOMMELIER_NAME}: ¿qué vas a comer?`}
                className="h-12 min-w-0 flex-1 rounded-full bg-canvas px-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isBusy}
                aria-label="Enviar mensaje"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:brightness-110 disabled:opacity-40"
              >
                <SendHorizontal size={18} />
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
