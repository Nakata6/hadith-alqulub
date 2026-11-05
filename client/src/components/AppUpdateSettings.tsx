import { LATEST_VERSION } from "@/lib/changelog";
import { useEffect, useRef, useState } from "react";
import { applyServiceWorkerUpdate, checkForAppUpdate, getAppRegistration, getInstalledRevision } from "@/lib/pwa";

export function AppUpdateSettings({ available, beforeUpdate }: { available: boolean; beforeUpdate: () => boolean }) {
  const [ready, setReady] = useState(available);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState("جارٍ القراءة…");
  const locked = useRef(false);
  useEffect(() => { if (available) setReady(true); }, [available]);
  useEffect(() => {
    let mounted = true;
    void getInstalledRevision().then(value => { if (mounted) setRevision(value); });
    void getAppRegistration().then(r => { if (mounted && r.waiting) setReady(true); }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  async function run(install: boolean) {
    if (locked.current) return;
    locked.current = true; setBusy(true);
    try {
      if (install) {
        if (!beforeUpdate()) throw new Error("تعذر حفظ بياناتك على الجهاز. لن نعيد تشغيل اللعبة حتى ينجح الحفظ.");
        setMessage("جارٍ تثبيت التحديث وإعادة فتح اللعبة…");
        if (!await applyServiceWorkerUpdate()) { setReady(false); setMessage("لا يوجد تحديث جاهز؛ ابحث مجددًا."); }
      } else {
        setMessage("جارٍ البحث عن تحديث…");
        const found = await checkForAppUpdate(() => setMessage("جارٍ تنزيل ملفات التحديث…"));
        setReady(found); setMessage(found ? "التحديث جاهز للتثبيت." : "نسختك محدّثة.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر التحديث. حاول مجددًا."); }
    finally { locked.current = false; setBusy(false); }
  }
  return <section className="settings-dialog__section" aria-labelledby="settings-update-title">
    <div>
      <h3 id="settings-update-title">تحديث اللعبة</h3>
      <p>إصدار اللعبة: <bdi>{LATEST_VERSION}</bdi></p>
      <p>نسخة الملفات المحلية: <bdi>{revision}</bdi></p>
      <p>يحتاج تنزيل التحديث إلى الإنترنت. تبقى الجلسة والإعدادات محفوظة على جهازك.</p>
      <p role="status" aria-live="polite">{message || (ready ? "تحديث جديد جاهز للتثبيت." : "يمكنك البحث عن أحدث نسخة.")}</p>
    </div>
    <button className="primary-button settings-dialog__control" disabled={busy} onClick={() => void run(ready)}>
      {busy ? "يرجى الانتظار…" : ready ? "تثبيت التحديث وإعادة فتح اللعبة" : "البحث عن تحديث"}
    </button>
  </section>;
}
