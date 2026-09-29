"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Plus, RotateCcw, ShoppingBag, Sparkles, X } from "lucide-react";
import { QUIZ_STEPS, type QuizAnswers } from "@/lib/data/sommelier-quiz";
import { recommendProducts } from "@/app/actions/sommelier";
import type { Recommendation } from "@/lib/sommelier";
import { formatMXN } from "@/lib/pricing";
import { useCart } from "@/lib/cart-context";
import BottleFallback from "./BottleFallback";

type Partial3 = Partial<QuizAnswers>;

function RecommendationCard({ recommendation, rank }: { recommendation: Recommendation; rank: number }) {
  const { product, reasons } = recommendation;
  const { addItem, items } = useCart();
  const inCart = items.some((item) => item.product.id === product.id);

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08, duration: 0.3 }}
      className="flex gap-4 rounded-[22px] bg-[#f2f4f5] p-3"
    >
      <Link
        href={`/cervezas/${product.sku}`}
        className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-white"
      >
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill sizes="80px" className="object-contain p-1.5" />
        ) : (
          <div className="flex h-full items-center justify-center text-black/15">
            <BottleFallback className="h-14 w-14" />
          </div>
        )}
        {rank === 0 && (
          <span className="absolute left-1 top-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Top
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={`/cervezas/${product.sku}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:underline">
          {product.name}
        </Link>
        <p className="truncate text-xs text-black/45">
          {product.style} · {product.country}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {reasons.slice(0, 3).map((reason) => (
            <span key={reason} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black/60">
              {reason}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-semibold tabular-nums">{formatMXN(product.sale_price)}</span>
          <button
            type="button"
            onClick={() => addItem(product, 1, { openDrawer: false })}
            className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              inCart ? "bg-black text-white" : "bg-[#5433eb] text-white shadow-accent hover:brightness-110"
            }`}
          >
            {inCart ? <Check size={14} /> : <Plus size={14} />}
            {inCart ? "En tu carrito" : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </motion.li>
  );
}

export default function SommelierModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial3>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isPending, startTransition] = useTransition();
  const { openDrawer, itemCount } = useCart();

  const isFinished = step >= QUIZ_STEPS.length;
  const current = QUIZ_STEPS[step];

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleAnswer(id: string) {
    const next = { ...answers, [current.key]: id } as Partial3;
    setAnswers(next);
    setStep(step + 1);

    if (step + 1 >= QUIZ_STEPS.length) {
      startTransition(async () => {
        setRecommendations(await recommendProducts(next));
      });
    }
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setRecommendations([]);
  }

  function handleClose() {
    onClose();
    setTimeout(reset, 300);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Sommelier Cervezaverso: descubre tu cerveza ideal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xl"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto scrollbar-none rounded-[28px] bg-white p-6 shadow-card sm:p-8"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              {step > 0 && !isFinished ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1 text-sm font-semibold text-black/45 hover:text-black"
                >
                  <ArrowLeft size={16} /> Atrás
                </button>
              ) : (
                <span className="flex items-center gap-2 text-sm font-semibold text-accent">
                  <Sparkles size={16} /> Sommelier Cervezaverso
                </span>
              )}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>

            {!isFinished && (
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
            )}

            <AnimatePresence mode="wait">
              {!isFinished ? (
                <motion.div
                  key={current.key}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22 }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/35">
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
                            selected ? "bg-black text-white" : "bg-[#f2f4f5] hover:bg-black hover:text-white"
                          }`}
                        >
                          <span className="text-2xl" aria-hidden>
                            {option.emoji}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold leading-tight">{option.label}</span>
                            <span
                              className={`block text-xs ${selected ? "text-white/60" : "text-black/45 group-hover:text-white/60"}`}
                            >
                              {option.hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <h3 className="text-2xl font-semibold tracking-[-0.035em]">Tus 3 cervezas ideales</h3>
                  <p className="mb-5 mt-1 text-sm text-black/50">
                    Elegidas del catálogo según tu sabor, tu ocasión y la intensidad que buscas.
                  </p>

                  {isPending ? (
                    <ul className="space-y-3" role="status" aria-label="Buscando tus cervezas…">
                      {[0, 1, 2].map((i) => (
                        <li key={i} className="h-[120px] animate-pulse rounded-[22px] bg-[#f2f4f5]" />
                      ))}
                    </ul>
                  ) : recommendations.length > 0 ? (
                    <ul className="space-y-3">
                      {recommendations.map((recommendation, i) => (
                        <RecommendationCard key={recommendation.product.id} recommendation={recommendation} rank={i} />
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-[20px] bg-[#f2f4f5] px-5 py-4 text-sm text-black/55">
                      Por ahora no tenemos cervezas disponibles con ese perfil. Prueba con otra combinación.
                    </p>
                  )}

                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={reset}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-black/5 py-3 text-sm font-semibold hover:bg-black/10"
                    >
                      <RotateCcw size={15} /> Repetir el quiz
                    </button>
                    {itemCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          handleClose();
                          openDrawer();
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-black py-3 text-sm font-semibold text-white"
                      >
                        <ShoppingBag size={15} /> Ver carrito ({itemCount})
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
