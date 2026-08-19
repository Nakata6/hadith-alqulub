import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

type Kind = "question" | "penalty" | "tip";

const kindLabels: Record<Kind, string> = {
  question: "سؤال",
  penalty: "عقوبة لطيفة",
  tip: "نصيحة",
};

export function ContentSuggestionForm({ onComplete }: { onComplete?: () => void }) {
  const utils = trpc.useUtils();
  const [kind, setKind] = useState<Kind>("question");
  const [level, setLevel] = useState<"hamasat" | "nabd" | "aamaq" | "jawhar">("hamasat");
  const [body, setBody] = useState("");
  const [summary, setSummary] = useState("");
  const [narrator, setNarrator] = useState("");
  const [source, setSource] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const mutation = trpc.content.suggest.useMutation({
    onSuccess: async () => {
      await utils.content.mine.invalidate();
      setBody("");
      setSummary("");
      setNarrator("");
      setSource("");
      setSourceUrl("");
      toast.success("حُفظ اقتراحك وهو الآن قيد المراجعة.");
      onComplete?.();
    },
    onError: error => toast.error(error.message || "تعذر حفظ الاقتراح."),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({
      kind,
      level: kind === "question" ? level : undefined,
      body,
      summary: kind === "tip" ? summary : undefined,
      narrator: kind === "tip" ? narrator : undefined,
      source: kind === "tip" ? source : undefined,
      sourceUrl: kind === "tip" ? sourceUrl : undefined,
    });
  }

  return (
    <form className="suggestion-form" onSubmit={submit}>
      <div className="form-section-title"><span>اقتراح جديد</span><p>يبقى الاقتراح خاصاً بك حتى يراجعه المدير.</p></div>
      <div className="kind-switch" aria-label="نوع الاقتراح">
        {(Object.keys(kindLabels) as Kind[]).map(option => (
          <button key={option} type="button" className={kind === option ? "selected" : ""} onClick={() => setKind(option)}>{kindLabels[option]}</button>
        ))}
      </div>
      {kind === "question" ? (
        <div className="form-field">
          <Label htmlFor="suggestion-level">مستوى السؤال</Label>
          <select id="suggestion-level" value={level} onChange={event => setLevel(event.target.value as typeof level)}>
            <option value="hamasat">همسات</option><option value="nabd">نبض</option><option value="aamaq">أعماق</option><option value="jawhar">جوهر</option>
          </select>
        </div>
      ) : null}
      <div className="form-field">
        <Label htmlFor="suggestion-body">{kind === "question" ? "نص السؤال" : kind === "penalty" ? "نص العقوبة اللطيفة" : "نص النصيحة"}</Label>
        <Textarea id="suggestion-body" value={body} onChange={event => setBody(event.target.value)} placeholder={kind === "question" ? "اكتب سؤالاً يفتح مساحة للحوار…" : kind === "penalty" ? "اكتب تحدياً لطيفاً ومحترماً…" : "اكتب النص أو الحكمة المقترحة…"} required minLength={3} maxLength={2000} rows={5} />
      </div>
      {kind === "tip" ? (
        <div className="tip-fields">
          <div className="form-field"><Label htmlFor="suggestion-summary">شرح موجز</Label><Textarea id="suggestion-summary" value={summary} onChange={event => setSummary(event.target.value)} required maxLength={1500} rows={3} placeholder="لماذا قد تكون هذه النصيحة نافعة؟" /></div>
          <div className="two-fields"><div className="form-field"><Label htmlFor="suggestion-narrator">القائل أو الراوي</Label><Input id="suggestion-narrator" value={narrator} onChange={event => setNarrator(event.target.value)} maxLength={255} placeholder="مثال: الإمام الصادق (ع)" /></div><div className="form-field"><Label htmlFor="suggestion-source">المرجع</Label><Input id="suggestion-source" value={source} onChange={event => setSource(event.target.value)} maxLength={500} placeholder="مثال: الكافي، ج2" /></div></div>
          <div className="form-field"><Label htmlFor="suggestion-source-url">رابط المصدر، إن توفر</Label><Input id="suggestion-source-url" type="url" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} maxLength={2000} placeholder="https://…" /></div>
        </div>
      ) : null}
      <Button className="submit-suggestion" type="submit" disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="animate-spin" /> : <Send />} إرسال الاقتراح للمراجعة</Button>
    </form>
  );
}
