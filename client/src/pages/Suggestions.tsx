import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { ContentSuggestionForm } from "@/components/ContentSuggestionForm";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { DEFAULT_SUGGESTION_FILTERS, filterSuggestions, SuggestionDateFilter, SuggestionKindFilter, SuggestionStatusFilter } from "@/lib/suggestionFilters";
import { canOwnerDeleteSuggestion } from "@shared/suggestionRules";
import { ArrowRight, Clock3, Lightbulb, Loader2, LogIn, PlusCircle, Search, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import React, { useMemo, useState } from "react";

const statusMeta = {
  pending: { label: "قيد المراجعة", className: "status-pending", icon: Clock3 },
  rejected: { label: "مرفوض", className: "status-rejected", icon: Trash2 },
  published: { label: "منشور للجميع", className: "status-published", icon: Lightbulb },
} as const;

const kindLabels = { question: "سؤال", penalty: "عقوبة", tip: "نصيحة" } as const;

export default function Suggestions() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [suggestionToDelete, setSuggestionToDelete] = useState<number | null>(null);
  const [filters, setFilters] = useState(DEFAULT_SUGGESTION_FILTERS);
  const query = trpc.content.mine.useQuery(undefined, { enabled: isAuthenticated });
  const filteredSuggestions = useMemo(() => filterSuggestions(query.data ?? [], filters), [query.data, filters]);
  const deleteSuggestion = trpc.content.deleteMine.useMutation({
    onSuccess: async () => {
      setSuggestionToDelete(null);
      await utils.content.mine.invalidate();
      toast.success("حُذف اقتراحك الخاص.");
    },
    onError: error => toast.error(error.message || "لا يمكن حذف الاقتراح."),
  });

  if (loading) return <div className="route-loading"><Loader2 className="animate-spin" /> جارٍ تحميل الحساب…</div>;
  if (!isAuthenticated) {
    return <main className="account-gate"><Lightbulb size={40} /><h1>مساحة اقتراحاتك</h1><p>سجل الدخول لتحتفظ باقتراحاتك الخاصة وتتابع حالتها حتى يتم نشرها للجميع.</p><Button onClick={() => startLogin()}><LogIn /> تسجيل الدخول</Button><Link href="/">العودة إلى اللعبة</Link></main>;
  }

  return (
    <main className="account-page" dir="rtl">
      <header className="subpage-header"><Link href="/"><ArrowRight size={18} /> العودة للعبة</Link><div><span>حسابي</span><h1>اقتراحاتي الخاصة</h1></div></header>
      <section className="suggestions-layout">
        <ContentSuggestionForm />
        <div className="my-suggestions">
          <div className="section-heading"><div><span>متابعة الاقتراحات</span><h2>اقتراحاتك وحالاتها</h2></div><PlusCircle size={26} /></div>
          {query.isLoading ? <div className="route-loading"><Loader2 className="animate-spin" /> جارٍ تحميل اقتراحاتك…</div> : null}
          {!query.isLoading && !query.data?.length ? <div className="empty-state"><Lightbulb size={31} /><p>لا توجد اقتراحات حتى الآن. ابدأ بإضافة سؤال أو عقوبة أو نصيحة.</p></div> : null}
          {!query.isLoading && query.data?.length ? <><div className="suggestion-filters" aria-label="بحث وفلترة الاقتراحات"><label className="suggestion-filter-search"><Search size={16} aria-hidden="true" /><input type="search" value={filters.query} onChange={event => setFilters(current => ({ ...current, query: event.target.value }))} placeholder="ابحث في اقتراحاتك" aria-label="ابحث في اقتراحاتك" /></label><select value={filters.kind} onChange={event => setFilters(current => ({ ...current, kind: event.target.value as SuggestionKindFilter }))} aria-label="فلترة حسب النوع"><option value="all">كل الأنواع</option><option value="question">أسئلة</option><option value="penalty">عقوبات</option><option value="tip">نصائح</option></select><select value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value as SuggestionStatusFilter }))} aria-label="فلترة حسب الحالة"><option value="all">كل الحالات</option><option value="pending">قيد المراجعة</option><option value="rejected">مرفوض</option><option value="published">منشور</option></select><select value={filters.date} onChange={event => setFilters(current => ({ ...current, date: event.target.value as SuggestionDateFilter }))} aria-label="فلترة حسب التاريخ"><option value="all">كل التواريخ</option><option value="today">اليوم</option><option value="week">آخر 7 أيام</option><option value="month">آخر شهر</option><option value="older">أقدم من شهر</option></select></div><p className="suggestion-filter-count">{filteredSuggestions.length} من {query.data.length} اقتراح</p>{!filteredSuggestions.length ? <div className="empty-state"><Search size={31} /><p>لا توجد اقتراحات تطابق الفلترة الحالية.</p></div> : null}</> : null}
          <div className="suggestion-list">
            {filteredSuggestions.map(item => {
              const status = statusMeta[item.status];
              const StatusIcon = status.icon;
              const canDelete = canOwnerDeleteSuggestion(item.status);
              return <article className="suggestion-card" key={item.id}><div className="suggestion-top"><span className="kind-badge">{kindLabels[item.kind]}</span><span className={`status-badge ${status.className}`}><StatusIcon size={14} />{status.label}</span></div><p>{item.body}</p>{item.reviewNote ? <small className="review-note">ملاحظة المدير: {item.reviewNote}</small> : null}{canDelete ? <button className="delete-suggestion" disabled={deleteSuggestion.isPending} onClick={() => setSuggestionToDelete(item.id)}><Trash2 size={15} /> حذف اقتراحي</button> : <small className="protected-copy">هذا المحتوى أصبح منشوراً للجميع ولا يمكن حذفه من حسابك.</small>}</article>;
            })}
          </div>
        </div>
      </section>
      <AlertDialog open={suggestionToDelete !== null} onOpenChange={open => { if (!open && !deleteSuggestion.isPending) setSuggestionToDelete(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الاقتراح؟</AlertDialogTitle>
            <AlertDialogDescription>سيُحذف هذا الاقتراح من قائمتك الخاصة ولا يمكن استعادته. لا يمكن حذف المحتوى المنشور للجميع من هنا.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSuggestion.isPending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction disabled={deleteSuggestion.isPending || suggestionToDelete === null} onClick={() => { if (suggestionToDelete !== null) deleteSuggestion.mutate({ id: suggestionToDelete }); }}>
              {deleteSuggestion.isPending ? "جارٍ الحذف…" : "حذف الاقتراح"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
