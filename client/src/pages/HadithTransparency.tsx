import { ArrowLeft, ExternalLink, FileSearch, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  filterHadithTransparencyEntries,
  hadithTransparencyCounts,
  type TransparencyFilter,
} from "@/lib/hadithTransparency";

const FILTERS: readonly { id: TransparencyFilter; label: string }[] = [
  { id: "published", label: "المعروض في اللعبة" },
  { id: "research", label: "مسجل للبحث" },
  { id: "all", label: "السجل الكامل" },
];

export default function HadithTransparency() {
  const [filter, setFilter] = useState<TransparencyFilter>("published");
  const counts = useMemo(() => hadithTransparencyCounts(), []);
  const entries = useMemo(() => filterHadithTransparencyEntries(filter), [filter]);

  return (
    <main className="transparency-page">
      <header className="subpage-header transparency-header">
        <Link href="/"><ArrowLeft size={17} /> العودة إلى اللعبة</Link>
        <div>
          <span>توثيق قابل للمراجعة</span>
          <h1>سجل الروايات والمراجع</h1>
          <p>نوضح هنا ما يُعرض في اللعبة، والحكم المنسوب إلى مرجعه، والمواد التي بقيت قيد البحث بدلاً من تقديمها كأنها موثقة.</p>
        </div>
      </header>

      <section className="transparency-summary" aria-label="ملخص سجل التوثيق">
        <div><strong>{counts.published}</strong><span>رواية معروضة</span></div>
        <div><strong>{counts.research}</strong><span>موضع محفوظ للبحث</span></div>
        <div><strong>1</strong><span>قاعدة نشر واضحة</span></div>
      </section>

      <section className="transparency-policy" aria-labelledby="transparency-policy-title">
        <div className="transparency-policy__title"><ShieldCheck size={25} /><div><span>كيف نقرر النشر؟</span><h2 id="transparency-policy-title">الحكم يُنسب إلى مرجعه</h2></div></div>
        <p>لا تكفي شهرة الكتاب أو ظهور السند وحدهما. لا تدخل الرواية كتالوج اللعبة إلا عندما يوجد موضع شيعي قابل للفتح وحكم منشور على السند المطابق، مع اسم المرجع وكتاب الحكم أو رابط المراجعة.</p>
        <div className="transparency-policy__rules">
          <div><b>المعروض</b><span>رواية بحكم منشور ومصدر مباشر.</span></div>
          <div><b>قيد البحث</b><span>مصدر أو سند ظاهر، لكن بلا حكم منشور مؤهل.</span></div>
          <div><b>حدود التطبيق</b><span>التطبيق الأسري إرشادي ولا يبرر الأذى أو إلغاء السلامة.</span></div>
        </div>
      </section>

      <section className="transparency-records" aria-labelledby="transparency-records-title">
        <div className="transparency-records__heading">
          <div><span>السجل المفصل</span><h2 id="transparency-records-title">{filter === "published" ? "الروايات المتاحة داخل اللعبة" : filter === "research" ? "المواضع المحفوظة للبحث" : "كل قرارات التوثيق"}</h2></div>
          <div className="transparency-filters" role="group" aria-label="تصفية سجل التوثيق">
            {FILTERS.map(item => <button key={item.id} className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)} aria-pressed={filter === item.id}>{item.label}</button>)}
          </div>
        </div>

        <div className="transparency-list">
          {entries.map(entry => (
            <article className={`transparency-record transparency-record--${entry.status}`} key={entry.id}>
              <header>
                <span className={`transparency-status transparency-status--${entry.status}`}>{entry.status === "published" ? "معروض في اللعبة" : "قيد البحث"}</span>
                <small>{entry.source}</small>
              </header>
              <blockquote>{entry.text}</blockquote>
              <dl>
                <div><dt>الراوي</dt><dd>{entry.narrator || "غير مثبت في هذا السجل"}</dd></div>
                <div><dt>الموضع</dt><dd>{entry.reference}</dd></div>
                <div><dt>الحكم المنسوب</dt><dd>{entry.verificationLabel}</dd></div>
                {entry.sourceLocation ? <div><dt>تفصيل الموضع</dt><dd>{entry.sourceLocation}</dd></div> : null}
              </dl>
              <p className="transparency-record__reason"><FileSearch size={16} /> {entry.reason}</p>
              {entry.sourceUrl ? <a href={entry.sourceUrl} target="_blank" rel="noreferrer">فتح المصدر أو موضع المراجعة <ExternalLink size={15} /></a> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
