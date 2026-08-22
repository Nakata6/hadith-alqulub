import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { ONBOARDING_STEPS, type OnboardingScreen } from "@/lib/onboardingSteps";

type Rect = { top: number; right: number; bottom: number; left: number; width: number; height: number };

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function OnboardingTour({
  open,
  screen,
  activeCardOpen,
  stepIndex,
  onStepChange,
  onComplete,
}: {
  open: boolean;
  screen: OnboardingScreen;
  activeCardOpen: boolean;
  stepIndex: number;
  onStepChange: (index: number) => void;
  onComplete: (skipped: boolean) => void;
}) {
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const step = ONBOARDING_STEPS[stepIndex];
  const total = ONBOARDING_STEPS.length;

  useEffect(() => {
    if (!open || !step) return;
    const screenOrder: Record<OnboardingScreen, number> = { welcome: 0, starter: 1, game: 2 };
    if (step.screen && screenOrder[screen] > screenOrder[step.screen]) {
      const next = ONBOARDING_STEPS.findIndex((item, index) => index >= stepIndex && item.screen === screen);
      if (next >= 0) onStepChange(next);
    }
    if (screen === "game" && activeCardOpen && step.id === "cards") onStepChange(stepIndex + 1);
    if (screen === "game" && !activeCardOpen && step.id === "question-actions") onStepChange(stepIndex + 1);
  }, [activeCardOpen, onStepChange, open, screen, step, stepIndex]);

  useLayoutEffect(() => {
    if (!open || !step?.targetSelector || (step.screen && step.screen !== screen)) {
      setTargetRect(null);
      return;
    }
    let observer: ResizeObserver | undefined;
    let timeout: number | undefined;
    const measure = () => {
      const target = document.querySelector<HTMLElement>(step.targetSelector!);
      if (!target) {
        setTargetRect(null);
        return;
      }
      target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center", inline: "nearest" });
      const apply = () => {
        const rect = target.getBoundingClientRect();
        setTargetRect({ top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height });
      };
      timeout = window.setTimeout(apply, prefersReducedMotion() ? 0 : 180);
      apply();
      observer = new ResizeObserver(apply);
      observer.observe(target);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("orientationchange", measure);
    return () => {
      if (timeout) window.clearTimeout(timeout);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("orientationchange", measure);
    };
  }, [open, screen, step]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onComplete(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onComplete, open]);

  const tooltipStyle = useMemo(() => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const isTop = step?.placement === "top" && targetRect.top > 190;
    const top = isTop ? Math.max(12, targetRect.top - 182) : Math.min(window.innerHeight - 196, targetRect.bottom + 14);
    const left = Math.max(12, Math.min(window.innerWidth - 332, targetRect.left + targetRect.width / 2 - 160));
    return { top, left };
  }, [step?.placement, targetRect]);

  if (!open || !step || (step.screen && step.screen !== screen)) return null;

  const next = () => stepIndex >= total - 1 ? onComplete(false) : onStepChange(stepIndex + 1);
  const previous = () => onStepChange(Math.max(0, stepIndex - 1));
  const hasSpotlight = Boolean(targetRect);

  return (
    <div className="onboarding-tour" aria-live="polite">
      {hasSpotlight ? <>
        <div className="onboarding-tour__shade" style={{ inset: `0 0 ${Math.max(0, window.innerHeight - targetRect!.top)}px 0` }} aria-hidden="true" />
        <div className="onboarding-tour__shade" style={{ inset: `${targetRect!.bottom}px 0 0 0` }} aria-hidden="true" />
        <div className="onboarding-tour__shade" style={{ top: targetRect!.top, bottom: Math.max(0, window.innerHeight - targetRect!.bottom), left: 0, right: Math.max(0, window.innerWidth - targetRect!.left) }} aria-hidden="true" />
        <div className="onboarding-tour__shade" style={{ top: targetRect!.top, bottom: Math.max(0, window.innerHeight - targetRect!.bottom), left: targetRect!.right, right: 0 }} aria-hidden="true" />
      </> : <div className="onboarding-tour__shade onboarding-tour__shade--full" aria-hidden="true" />}
      {hasSpotlight ? <div className="onboarding-tour__ring" style={{ top: targetRect!.top - 5, left: targetRect!.left - 5, width: targetRect!.width + 10, height: targetRect!.height + 10 }} aria-hidden="true" /> : null}
      <section className="onboarding-tour__tooltip" role="dialog" aria-modal="false" aria-labelledby="onboarding-title" style={tooltipStyle}>
        <button className="onboarding-tour__skip" onClick={() => onComplete(true)} aria-label="تخطي الجولة التعريفية"><X size={17} /> تخطي</button>
        <span>خطوة {stepIndex + 1} من {total}</span>
        <h2 id="onboarding-title">{step.title}</h2>
        <p>{step.body}</p>
        <footer>
          <button className="secondary-button" onClick={previous} disabled={stepIndex === 0}><ArrowRight size={16} /> السابق</button>
          <button className="primary-button" onClick={next}>{stepIndex === total - 1 ? "إنهاء الجولة" : <>التالي <ArrowLeft size={16} /></>}</button>
        </footer>
      </section>
    </div>
  );
}
