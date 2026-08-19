import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Archive, CheckCircle2, ClipboardCheck, Loader2, LogIn, ShieldAlert, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Filter = "pending" | "rejected" | "published";
const kindLabels = { question: "سؤال", penalty: "عقوبة", tip: "نصيحة" } as const;

export default function AdminContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<Filter>("pending");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const utils = trpc.useUtils();
  const queue = trpc.content.reviewQueue.useQuery({ status: filter }, { enabled: Boolean(isAuthenticated && user?.role === "admin") });
  const published = trpc.content.listPublished.useQuery(undefined, { enabled: Boolean(isAuthenticated && user?.role === "admin") });
  const refresh = async () => Promise.all([utils.content.reviewQueue.invalidate(), utils.content.listPublished.invalidate()]);
  const publish = trpc.content.publish.useMutation({ onSuccess: async () => { await refresh(); toast.success("نُشر المحتوى وأصبح متاحاً للجميع."); }, onError: error => toast.error(error.message) });
  const reject = trpc.content.reject.useMutation({ onSuccess: async () => { await refresh(); toast.success("تم رفض الاقتراح مع إبقائه خاصاً بصاحبه."); }, onError: error => toast.error(error.message) });
  const archive = trpc.content.archivePublic.useMutation({ onSuccess: async () => { await refresh(); toast.success("أُزيل المحتوى من المحتوى العام."); }, onError: error => toast.error(error.message) });

  if (loading) return <div className="route-loading"><Loader2 className="animate-spin" /> جارٍ التحقق من الصلاحية…</div>;
  if (!isAuthenticated) return <main className="account-gate"><ShieldAlert size={40} /><h1>إدارة المحتوى</h1><p>سجل الدخول بحساب المدير للوصول إلى مراجعة الاقتراحات.</p><Button onClick={() => startLogin()}><LogIn /> تسجيل الدخول</Button></main>;
  if (user?.role !== "admin") return <main className="account-gate"><ShieldAlert size={40} /><h1>هذه الصفحة للمدير فقط</h1><p>لا تملك صلاحية مراجعة أو نشر اقتراحات المستخدمين.</p></main>;

  return <DashboardLayout><div className="admin-page" dir="rtl"><header className="admin-hero"><div><span>لوحة المدير</span><h1>مراجعة المحتوى ونشره</h1><p>المحتوى المقبول ينتقل إلى المحتوى العام. أما المرفوض فيبقى مرئياً لصاحبه فقط.</p></div><ClipboardCheck size={42} /></header><div className="admin-tabs">{(["pending", "rejected", "published"] as Filter[]).map(item => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "pending" ? "قيد المراجعة" : item === "rejected" ? "مرفوض" : "منشور"}</button>)}</div><section className="review-queue">{queue.isLoading ? <div className="route-loading"><Loader2 className="animate-spin" /> جارٍ تحميل المراجعات…</div> : null}{!queue.isLoading && !queue.data?.length ? <div className="empty-state"><ClipboardCheck size={31} /><p>لا توجد عناصر في هذه الحالة الآن.</p></div> : null}{queue.data?.map(row => <article className="review-card" key={row.suggestion.id}><div className="review-meta"><span>{kindLabels[row.suggestion.kind]}</span><small>{row.ownerName || row.ownerEmail || "مستخدم"}</small><time>{new Date(row.suggestion.createdAt).toLocaleDateString("ar-SA")}</time></div><p>{row.suggestion.body}</p>{row.suggestion.kind === "tip" && row.suggestion.summary ? <blockquote>{row.suggestion.summary}</blockquote> : null}{filter === "pending" ? <div className="review-actions"><Input value={notes[row.suggestion.id] || ""} onChange={event => setNotes(current => ({ ...current, [row.suggestion.id]: event.target.value }))} placeholder="سبب الرفض، اختياري" maxLength={1500} /><Button onClick={() => publish.mutate({ id: row.suggestion.id })} disabled={publish.isPending}><CheckCircle2 /> قبول ونشر</Button><Button variant="outline" onClick={() => reject.mutate({ id: row.suggestion.id, reviewNote: notes[row.suggestion.id] || undefined })} disabled={reject.isPending}><XCircle /> رفض</Button></div> : <div className="admin-readonly">{row.suggestion.status === "published" ? "نُشر هذا الاقتراح ضمن المحتوى العام." : `ملاحظة المدير: ${row.suggestion.reviewNote || "لم تُسجّل ملاحظة."}`}</div>}</article>)}</section><section className="public-content-section"><div className="section-heading"><div><span>المحتوى العام</span><h2>إدارة ما نُشر للمستخدمين</h2></div><Archive size={24} /></div><div className="public-content-grid">{published.data?.map(item => <article key={item.id} className="public-content-card"><span>{kindLabels[item.kind]}</span><p>{item.body}</p><Button variant="outline" size="sm" onClick={() => archive.mutate({ id: item.id })} disabled={archive.isPending}><Archive size={15} /> إيقاف النشر</Button></article>)}</div></section></div></DashboardLayout>;
}
