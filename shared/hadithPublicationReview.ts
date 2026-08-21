import { ORIGINAL_GAME_DATA } from "./originalGameData";

export type HadithPublicationDecision = "excluded" | "approved";
export type MajlisiGrade = "صحيح" | "حسن" | "حسن كالصحيح" | "موثق" | "ضعيف" | "مرسل" | "غير متحققة";
export type HadithReviewStatus = "accepted" | "rejected_weak_or_mursal" | "source_found_without_grade" | "non_shia_source_identified" | "source_or_attribution_unverified";
export type SourceEvidenceStatus = "thaqalayn_direct" | "shia_alternate_or_text_variant" | "no_source_verified" | "non_shia_source_identified";
export type HadithPublicationBasis = "majlisi_accepted" | "verified_shia_chain";

export type CuratedShiaHadithTip = {
  id: string;
  text: string;
  summary: string;
  application?: string;
  narrator: string;
  source: string;
  reference: string;
  sourceUrl: string;
  majlisiGrade: "صحيح" | "حسن" | "حسن كالصحيح" | "موثق";
  shiaSourceLocation: string;
};

export type HadithPublicationReview = {
  text: string;
  speaker: string;
  originalSource: string;
  originalReference: string;
  majlisiGrade: MajlisiGrade;
  reviewStatus: HadithReviewStatus;
  sourceEvidenceStatus: SourceEvidenceStatus;
  decision: HadithPublicationDecision;
  reason: string;
  thaqalaynSearchUrl: string;
  shiaSourceUrl?: string;
  shiaSourceLocation?: string;
  gradingReferenceUrl?: string;
  publicationBasis?: HadithPublicationBasis;
  publishedText?: string;
  publishedSource?: string;
  publishedReference?: string;
  publishedSpeaker?: string;
};

type MajlisiFinding = Pick<HadithPublicationReview, "majlisiGrade" | "shiaSourceUrl" | "shiaSourceLocation" | "gradingReferenceUrl" | "publicationBasis" | "publishedText" | "publishedSource" | "publishedReference" | "publishedSpeaker">;

const MAJLISI_FINDINGS_BY_TEXT: Readonly<Record<string, MajlisiFinding>> = {
  "جُلُوسُ الْمَرْأَةِ عِنْدَ زَوْجِهَا أَحَبُّ إِلَى اللَّهِ تَعَالَى مِنَ اعْتِكَافٍ فِي مَسْجِدِي هَذَا": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://rafed.net/reyhana/article/15699",
    shiaSourceLocation: "تنبيه الخواطر؛ النص المنشور بلفظ «جلوس المرء عند عياله...» وهو مختلف عن النص المؤرشف",
  },
  "التَّوَدُّدُ إِلَى النَّاسِ نِصْفُ الْعَقْلِ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11017/1/285",
    shiaSourceLocation: "مسند الإمام الرضا، ج1، ص285؛ يحيل إلى تحف العقول، ص325",
  },
  "إِنَّ اللَّهَ عَزَّ وَجَلَّ إِذَا أَحَبَّ أَهْلَ بَيْتٍ أَدْخَلَ عَلَيْهِمُ الرِّفْقَ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/chapter/31/2/3",
    shiaSourceLocation: "كتاب الزهد، ج1، كتاب 2، باب حسن الخلق؛ لفظ قريب «إذا أراد الله بأهل بيت خيراً رزقهم الرفق في المعيشة وحسن الخلق»",
  },
  "إِنَّ الْمَرْأَةَ رَيْحَانَةٌ وَلَيْسَتْ بِقَهْرَمَانَةٍ": {
    majlisiGrade: "ضعيف",
    shiaSourceUrl: "https://thaqalayn.net/hadith/5/3/151/3",
    shiaSourceLocation: "الكافي، ج5، كتاب 3، باب إكرام المرأة، الحديث 3",
    gradingReferenceUrl: "https://thaqalayn.net/hadith/5/3/151/3",
  },
  "الْعَبْدُ كُلَّمَا ازْدَادَ لِلنِّسَاءِ حُبّاً ازْدَادَ فِي الْإِيمَانِ فَضْلًا": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/ar/chapter/36/3/5",
    shiaSourceLocation: "من لا يحضره الفقيه، ج3، كتاب 3، باب حب النساء؛ الرواية الأولى تورد النص عن أبي العباس عن الإمام الصادق (ع)",
    publicationBasis: "verified_shia_chain",
    publishedSource: "من لا يحضره الفقيه",
    publishedReference: "ج3، كتاب 3، باب حب النساء، الحديث 1",
    publishedSpeaker: "الإمام الصادق (ع)",
  },
  "أَيُّمَا امْرَأَةٍ خَدَمَتْ زَوْجَهَا سَبْعَةَ أَيَّامٍ أَغْلَقَ اللَّهُ عَنْهَا سَبْعَةَ أَبْوَابِ النَّارِ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11025/20/172",
    shiaSourceLocation: "وسائل الشيعة، ج20، ص172، الحديث 25342؛ الحاشية تصرح بعدم العثور عليه في تنبيه الخواطر المطبوع",
  },
  "خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ، وَأَنَا خَيْرُكُمْ لِأَهْلِي": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/36/4/25/10",
    shiaSourceLocation: "من لا يحضره الفقيه، ج3، كتاب 4، باب 25، الحديث 10",
  },
  "مَا مِنِ امْرَأَةٍ تَسْقِي زَوْجَهَا شَرْبَةً مِنْ مَاءٍ إِلَّا كَانَ خَيْراً لَهَا مِنْ عِبَادَةِ سَنَةٍ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11025/20/172",
    shiaSourceLocation: "وسائل الشيعة، ج20، ص172، الحديث 25343؛ الحاشية تصرح بعدم العثور عليه في تنبيه الخواطر المطبوع",
  },
};

const MAJLISI_FINDINGS_BY_ORIGINAL_REFERENCE: Readonly<Record<string, MajlisiFinding>> = {
  "مستدرك الوسائل ج15 ص116": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11015/15/116",
    shiaSourceLocation: "مستدرك الوسائل، ج15، ص116، الحديث 17709؛ يرويه جامع الأخبار عن أبي هريرة",
  },
  "بحار الأنوار ج43 ص117": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11008/43/117",
    shiaSourceLocation: "بحار الأنوار، ج43، ص117؛ خبر سؤال النبي للإمام علي عن فاطمة",
  },
  "جامع السعادات ج2 ص140": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11008/104/132",
    shiaSourceLocation: "بحار الأنوار، ج104، ص132، باب فضل خدمة العيال؛ ينقل عن جامع الأخبار ص102",
  },
  "الحكمة 136": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/10/25/10/1",
    shiaSourceLocation: "الخصال، الكتاب 25، الباب 10، الحديث 1؛ السند منشور في الموضع",
    publicationBasis: "verified_shia_chain",
    publishedSource: "الخصال",
    publishedReference: "الكتاب 25، الباب 10، الحديث 1",
    publishedSpeaker: "الإمام الباقر (ع)",
  },
  "ج66 ص408": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/ar/chapter/10/4/15",
    shiaSourceLocation: "الخصال، ج1، الكتاب 4، الباب 15، الحديث 1؛ السند منشور في الموضع",
    publicationBasis: "verified_shia_chain",
    publishedText: "مَنْ حَسُنَ بَرُّهُ بِأَهْلِهِ زَادَ اللَّهُ فِي عُمُرِهِ",
    publishedSource: "الخصال",
    publishedReference: "ج1، الكتاب 4، الباب 15، الحديث 1",
    publishedSpeaker: "الإمام الصادق (ع)",
  },
  "ج5 ص569": {
    majlisiGrade: "ضعيف",
    shiaSourceUrl: "https://thaqalayn.net/hadith/5/3/190/59",
    shiaSourceLocation: "الكافي، ج5، كتاب 3، باب 190، ح59",
    gradingReferenceUrl: "https://thaqalayn.net/hadith/5/3/190/59",
  },
  "الكافي ج2 ص110": {
    majlisiGrade: "مرسل",
    shiaSourceUrl: "https://thaqalayn.net/ar/hadith/2/1/54/6",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب كظم الغيظ، ح6",
    gradingReferenceUrl: "https://thaqalayn.net/ar/hadith/2/1/54/6",
  },
  "ج5 ص144": {
    majlisiGrade: "ضعيف",
    shiaSourceUrl: "https://thaqalayn.net/ar/hadith/5/2/50/14",
    shiaSourceLocation: "الكافي، ج5، كتاب 2، باب الهدية، الحديث 14",
    gradingReferenceUrl: "https://thaqalayn.net/ar/hadith/5/2/50/14",
  },
  "الكافي ج2 ص189": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/30/1/5/21",
    shiaSourceLocation: "كتاب المؤمن، الكتاب 1، الباب 5، الحديث 21",
  },
  "الكافي ج2 ص321": {
    majlisiGrade: "حسن كالصحيح",
    shiaSourceUrl: "https://thaqalayn.net/hadith/2/1/129/1",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب سوء الخلق، الحديث 1",
    gradingReferenceUrl: "https://thaqalayn.net/hadith/2/1/129/1",
  },
  "الكافي ج2 ص635": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/29/1/36/16",
    shiaSourceLocation: "الأمالي، الكتاب 1، المجلس 36، الحديث 16؛ السند منشور في الموضع",
    publicationBasis: "verified_shia_chain",
    publishedSource: "الأمالي",
    publishedReference: "الكتاب 1، المجلس 36، الحديث 16",
    publishedSpeaker: "رسول الله (ص)",
  },
};

const originalHadiths = (ORIGINAL_GAME_DATA.DAILY_TIPS as unknown as ReadonlyArray<{
  text: string;
  speaker: string;
  source: string;
  reference: string;
  category: "hadith" | "expert";
}>).filter(item => item.category === "hadith");

const ACCEPTED_MAJLISI_GRADES: readonly MajlisiGrade[] = ["صحيح", "حسن", "حسن كالصحيح", "موثق"];

// نصائح منتقاة مستقلة عن الأرشيف الأصلي: مواضع شيعية مباشرة مع درجة مجلسي مقبولة منشورة في ثقلين.
export const CURATED_SHIA_HADITH_TIPS: readonly CuratedShiaHadithTip[] = [
  {
    id: "curated-hadith-anger-restraint",
    text: "مَا تَجَرَّعْتُ جُرْعَةً أَحَبَّ إِلَيَّ مِنْ جُرْعَةِ غَيْظٍ لَا أُكَافِي بِهَا صَاحِبَهَا",
    summary: "عند اشتداد الخلاف، امنح نفسك مساحة لتهدأ قبل أن ترد بالمثل أو تصعّد الموقف.",
    narrator: "الإمام زين العابدين (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب كظم الغيظ، الحديث 1",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/54/1",
    majlisiGrade: "حسن كالصحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب كظم الغيظ، الحديث 1",
  },
  {
    id: "curated-hadith-anger-patience",
    text: "نِعْمَ الْجُرْعَةُ الْغَيْظُ لِمَنْ صَبَرَ عَلَيْهَا",
    summary: "الصبر على الغضب مهارة مشتركة في العلاقة: أوقف النقاش مؤقتاً ثم عُد إليه بهدوء.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب كظم الغيظ، الحديث 2",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/54/2",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب كظم الغيظ، الحديث 2",
  },
  {
    id: "curated-hadith-wife-care",
    text: "يُشْبِعُهَا وَيَكْسُوهَا وَإِنْ جَهِلَتْ غَفَرَ لَهَا",
    summary: "يركز الإحسان في الحياة الزوجية على الرعاية العملية والإنصاف والمغفرة عند الخطأ.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج5، كتاب 3، باب حق المرأة على الزوج، الحديث 1",
    sourceUrl: "https://thaqalayn.net/hadith/5/3/152/1",
    majlisiGrade: "موثق",
    shiaSourceLocation: "الكافي، ج5، كتاب 3، باب حق المرأة على الزوج، الحديث 1",
  },
  {
    id: "curated-hadith-gentleness-women",
    text: "أَوْصَانِي جَبْرَئِيلُ بِالْمَرْأَةِ حَتَّى ظَنَنْتُ أَنَّهُ لَا يَنْبَغِي طَلَاقُهَا إِلَّا مِنْ فَاحِشَةٍ مُبَيِّنَةٍ",
    summary: "ليكن الرفق والاحترام والتروي أصل التعامل، لا التهديد أو الاستعجال عند الأزمات.",
    narrator: "رسول الله (ص)",
    source: "الكافي",
    reference: "ج5، كتاب 3، باب حق المرأة على الزوج، الحديث 6",
    sourceUrl: "https://thaqalayn.net/hadith/5/3/152/6",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج5، كتاب 3، باب حق المرأة على الزوج، الحديث 6",
  },
  {
    id: "curated-hadith-child-cry",
    text: "أَمَا سَمِعْتُمْ صُرَاخَ الصَّبِيِّ",
    summary: "مراعاة احتياج الطفل العاطفي جزء من التربية: انتبهوا لإشارات الضيق قبل أن تتحول إلى تصعيد.",
    narrator: "رسول الله (ص)",
    source: "الكافي",
    reference: "ج6، كتاب 1، باب حق الأولاد، الحديث 4",
    sourceUrl: "https://thaqalayn.net/hadith/6/1/34/4",
    majlisiGrade: "حسن",
    shiaSourceLocation: "الكافي، ج6، كتاب 1، باب حق الأولاد، الحديث 4",
  },
  {
    id: "curated-hadith-family-repair",
    text: "تَصِلُ مَنْ قَطَعَكَ وَتُعْطِي مَنْ حَرَمَكَ وَتَعْفُو عَمَّنْ ظَلَمَكَ",
    summary: "في خلافات العائلة، ابدأ بخطوة إصلاح آمنة: وصل، أو عطاء، أو عفو؛ مع مراعاة الحدود والسلامة الشخصية.",
    narrator: "رسول الله (ص)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب صلة الرحم، الحديث 2",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/68/2",
    majlisiGrade: "موثق",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب صلة الرحم، الحديث 2",
  },
  {
    id: "curated-hadith-kinship-kindness",
    text: "صِلْ رَحِمَكَ وَلَوْ بِشَرْبَةٍ مِنْ مَاءٍ وَأَفْضَلُ مَا تُوصَلُ بِهِ الرَّحِمُ كَفُّ الْأَذَى عَنْهَا",
    summary: "تقوية العائلة لا تحتاج فعلاً ضخماً: تواصل لطيف، ومساعدة يسيرة، والامتناع عن الأذى هي بداية عملية.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب صلة الرحم، الحديث 9",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/68/9",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب صلة الرحم، الحديث 9",
  },
  {
    id: "curated-hadith-initiate-family",
    text: "إِنِّي لَأُبَادِرُ أَهْلَ بَيْتِي أَصِلُهُمْ قَبْلَ أَنْ يَسْتَغْنُوا عَنِّي",
    summary: "لا تنتظر دائماً أن يطلب المقربون الاهتمام؛ بادر بالسؤال والزيارة والمساندة قبل الحاجة.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب صلة الرحم، الحديث 25",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/68/25",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب صلة الرحم، الحديث 25",
  },
  {
    id: "curated-hadith-household-partnership",
    text: "كَانَ أَمِيرُ الْمُؤْمِنِينَ صَلَوَاتُ اللهِ عَلَيْهِ يَحْتَطِبُ وَيَسْتَقِي وَيَكْنُسُ وَكَانَتْ فَاطِمَةُ سَلامُ اللهِ عَلَيْهَا تَطْحَنُ وَتَعْجِنُ وَتَخْبِزُ",
    summary: "تقدم الرواية صورة عملية للشراكة في أعمال البيت وخارجه، من دون تحويل الأدوار التاريخية إلى إلزام ثابت على أحد الزوجين.",
    application: "اتفقا على قائمة مرنة للمهام اليومية بحسب الوقت والطاقة والظروف، وراجعاها عند المرض أو ضغط العمل؛ فالمقصود شراكة عملية لا تحميل طرف واحد كل العبء.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج5، كتاب 2، باب عمل الرجل في بيته، الحديث 1",
    sourceUrl: "https://thaqalayn.net/ar/hadith/5/2/11/1",
    majlisiGrade: "حسن",
    shiaSourceLocation: "الكافي، ج5، كتاب 2، باب عمل الرجل في بيته، الحديث 1",
  },
  {
    id: "curated-hadith-family-sustenance",
    text: "الَّذِي يَطْلُبُ مِنْ فَضْلِ اللهِ عَزَّ وَجَلَّ مَا يَكُفُّ بِهِ عِيَالَهُ أَعْظَمُ أَجْراً مِنَ الْمُجَاهِدِ فِي سَبِيلِ اللهِ عَزَّ وَجَلَّ",
    summary: "يبين النص قيمة العمل الذي يكفي الأسرة، ويصلح للتأمل في تقدير الجهد المعيشي والرعاية الاقتصادية داخل البيت.",
    application: "اعترفا بمساهمة كل طرف في إعالة الأسرة، سواء كانت دخلاً أو رعاية منزلية أو عملاً غير مدفوع، وضَعا ميزانية مشتركة من دون تحويل الإنفاق إلى سيطرة أو منّة.",
    narrator: "الإمام الرضا (ع)",
    source: "الكافي",
    reference: "ج5، كتاب 2، باب كدّ على عياله، الحديث 2",
    sourceUrl: "https://thaqalayn.net/ar/hadith/5/2/13/2",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج5، كتاب 2، باب كدّ على عياله، الحديث 2",
  },
  {
    id: "curated-hadith-relieve-hardship",
    text: "مَنْ أَغَاثَ أَخَاهُ الْمُؤْمِنَ اللَّهْفَانَ اللَّهْثَانَ عِنْدَ جَهْدِهِ فَنَفَّسَ كُرْبَتَهُ وَأَعَانَهُ عَلَى نَجَاحِ حَاجَتِهِ",
    summary: "يركز النص على الاستجابة العملية للضيق: تفريج الكربة والمساعدة في إنجاز الحاجة، لا الاكتفاء بالتعاطف اللفظي.",
    application: "عند التعب أو الضيق، اسأل شريكك عن مساعدة محددة ثم خذ مهمة واقعية مثل إعداد الطعام أو رعاية الأطفال أو إنجاز معاملة؛ لتكن المساندة باحترام لا بلوم أو إلغاء للاستقلال.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب تفريج كرب المؤمن، الحديث 1",
    sourceUrl: "https://thaqalayn.net/ar/hadith/2/1/85/1",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب تفريج كرب المؤمن، الحديث 1",
  },
  {
    id: "curated-hadith-gentleness-blessing",
    text: "الرِّفْقُ يُمْنٌ وَالْخُرْقُ شُؤْمٌ",
    summary: "يجعل النص الرفق منهجاً مستمراً للمعاشرة وإدارة التفاصيل اليومية، لا مجرد استجابة مؤقتة عند نشوء الخلاف.",
    application: "اتفقا على قواعد بسيطة للحديث والعمل: خفض الصوت، الطلب بدلاً من الاتهام، وإتاحة وقت للراحة. الرفق لا يعني السكوت عن الأذى، بل طريقة غير عنيفة لوضع الحدود وطلب الإصلاح.",
    narrator: "رسول الله (ص)، برواية الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب الرفق، الحديث 4",
    sourceUrl: "https://thaqalayn.net/ar/hadith/2/1/58/4",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب الرفق، الحديث 4",
  },
  {
    id: "curated-hadith-child-kindness",
    text: "رَحِمَ اللَّهُ مَنْ أَعَانَ وَلَدَهُ عَلَى بِرِّهِ",
    summary: "يشرح النص أن إعانة الطفل تكون بقبول ميسوره، والتجاوز عن معسوره، وعدم إرهاقه أو التعامل معه بخرق.",
    application: "عند الخطأ أو التقصير، اسأل: ما الذي يقدر عليه الطفل الآن؟ ثم وجّهه من دون إهانة أو تحميل يفوق طاقته.",
    narrator: "رسول الله (ص)، برواية الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج6، كتاب 1، باب الرفق بالأولاد، الحديث 6",
    sourceUrl: "https://thaqalayn.net/hadith/6/1/35/6",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج6، كتاب 1، باب الرفق بالأولاد، الحديث 6",
  },
  {
    id: "curated-hadith-keep-promises-to-children",
    text: "إِذَا وَعَدْتُمُ الصِّبْيَانَ فَفُوا لَهُمْ",
    summary: "يربط النص الوفاء بالوعد مع الطفل بإدراكه أن والديه مصدر أمانه ورزقه، فيحفظ ثقته بهما.",
    application: "لا تعد بما لا تستطيع؛ وإذا تعذر الوفاء، اشرح السبب بلطف وحدد بديلاً أو موعداً واضحاً.",
    narrator: "أبو الحسن (ع)",
    source: "الكافي",
    reference: "ج6، كتاب 1، باب الرفق بالأولاد، الحديث 8",
    sourceUrl: "https://thaqalayn.net/hadith/6/1/35/8",
    majlisiGrade: "حسن",
    shiaSourceLocation: "الكافي، ج6، كتاب 1، باب الرفق بالأولاد، الحديث 8",
  },
  {
    id: "curated-hadith-repair-with-child",
    text: "اسْتَصْلِحْهُ فَمَا مِائَةُ أَلْفٍ فِيمَا أَنْعَمَ اللَّهُ بِهِ عَلَيْكَ",
    summary: "يوجه النص إلى تقديم إصلاح علاقة الوالد بطفله على الغضب من خسارة مادية سببها الطفل.",
    application: "عند تلف شيء أو وقوع خطأ، عالج الأثر العملي بهدوء ثم قدّم الحوار والتوجيه على التجريح أو قطع التواصل.",
    narrator: "أبو الحسن (ع)",
    source: "الكافي",
    reference: "ج6، كتاب 1، باب حق الأولاد، الحديث 2",
    sourceUrl: "https://thaqalayn.net/hadith/6/1/34/2",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج6، كتاب 1، باب حق الأولاد، الحديث 2",
  },
  {
    id: "curated-hadith-family-reconciliation",
    text: "فَاعْتَنَقَا وَبَكَيَا",
    summary: "يسجل الموقف مبادرة الإمام الصادق (ع) إلى قريب بعد خلاف صاخب، ثم وقوع الصلح بعد تذكر صلة ما أمر الله به أن يوصل.",
    application: "إن كان الإصلاح آمناً ومناسباً، ابدأ بخطوة تواصل هادئة بعد الخلاف. الرفق لا يلغي الحدود أو يبرر الأذى.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب صلة الرحم، الحديث 23",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/68/23",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب صلة الرحم، الحديث 23",
  },
  {
    id: "curated-hadith-arbitration-consent",
    text: "لَيْسَ لِلْحَكَمَيْنِ أَنْ يُفَرِّقَا حَتَّى يَسْتَأْمِرَا الرَّجُلَ وَالْمَرْأَةَ",
    summary: "عند تعقّد الخلاف، يلفت النص إلى أن الاستعانة بطرفين موثوقين لا تلغي موافقة الزوجين أو حقهما في فهم ما يُقترح عليهما.",
    application: "إذا تعذر الحوار وكان ذلك آمناً، اختارا مساعدة محايدة وبالتراضي. لا يُستخدم هذا النص بديلاً عن طلب الحماية أو الدعم المختص عند العنف أو الإكراه.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج6، كتاب 2، باب الحكمين في الشقاق، الحديث 2",
    sourceUrl: "https://thaqalayn.net/hadith/6/2/67/2",
    majlisiGrade: "حسن",
    shiaSourceLocation: "الكافي، ج6، كتاب 2، باب الحكمين في الشقاق، الحديث 2",
  },
  {
    id: "curated-hadith-gentle-dealings",
    text: "أَمَرَنِي رَبِّي بِمُدَارَاةِ النَّاسِ كَمَا أَمَرَنِي بِأَدَاءِ الْفَرَائِضِ",
    summary: "يجعل النص اللين في التعامل أصلاً مستمراً؛ ويمكن أن يترجم داخل البيت إلى احترام نبرة الحوار وإتاحة مساحة للشرح والاستماع.",
    application: "عند اختلافكما، ابدآ بتسمية ما تفهمانه من موقف الآخر قبل عرض الاعتراض، من دون أن يعني اللين قبول الإهانة أو تجاوز الحدود.",
    narrator: "الإمام الصادق (ع)، عن رسول الله (ص)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب المداراة، الحديث 4",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/57/4",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب المداراة، الحديث 4",
  },
  {
    id: "curated-hadith-practical-joy",
    text: "مِنْ أَحَبِّ الْأَعْمَالِ إِلَى اللَّهِ عَزَّ وَجَلَّ إِدْخَالُ السُّرُورِ عَلَى الْمُؤْمِنِ: إِشْبَاعُ جَوْعَتِهِ أَوْ تَنْفِيسُ كُرْبَتِهِ أَوْ قَضَاءُ دَيْنِهِ",
    summary: "يربط النص إدخال السرور بالفعل العملي: إطعام، أو تفريج كربة، أو إعانة في التزام مالي؛ لا بالمجاملة وحدها.",
    application: "اختَر فعلاً محدداً يخفف عن شريكك أو أسرتك اليوم: وجبة، مهمة مؤجلة، أو خطوة عملية في ضغط يمر به الطرف الآخر.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب إدخال السرور على المؤمن، الحديث 16",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/82/16",
    majlisiGrade: "حسن كالصحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب إدخال السرور على المؤمن، الحديث 16",
  },
  {
    id: "curated-hadith-kinship-greetings",
    text: "إِنَّ صِلَةَ الرَّحِمِ وَالْبِرَّ لَيُهَوِّنَانِ الْحِسَابَ ... فَصِلُوا أَرْحَامَكُمْ وَبَرُّوا بِإِخْوَانِكُمْ وَلَوْ بِحُسْنِ السَّلَامِ وَرَدِّ الْجَوَابِ",
    summary: "يفتح النص باباً عملياً لصلة الأسرة: تواصل مهذب، تحية حسنة، ورد لطيف، من دون اشتراط فعل كبير في كل مرة.",
    application: "اختارا قريباً أو فرداً من الأسرة يحتاج إلى تواصل آمن ولطيف، ثم بادرا بتحية أو رسالة احترام من دون ضغط أو تجاوُز للحدود.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب صلة الرحم، الحديث 31",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/68/31",
    majlisiGrade: "موثق",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب صلة الرحم، الحديث 31",
  },
  {
    id: "curated-hadith-truth-and-trust",
    text: "اخْتَبِرُوهُمْ عِنْدَ صِدْقِ الْحَدِيثِ وَأَدَاءِ الْأَمَانَةِ",
    summary: "يقدم النص الصدق وحفظ الأمانة معيارين عمليين للموثوقية؛ وهما أساس صالح للثقة المتبادلة داخل العلاقة.",
    application: "اتفقا على أمر صغير يحتاج وضوحاً هذا الأسبوع، ثم صرّحا بالتوقعات واحفظا ما يخص الطرف الآخر من معلومات أو التزامات.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب الصدق وأداء الأمانة، الحديث 2",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/51/2",
    majlisiGrade: "موثق",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب الصدق وأداء الأمانة، الحديث 2",
  },
  {
    id: "curated-hadith-protect-dignity",
    text: "اتَّقُوا اللَّهَ فِي الضَّعِيفَيْنِ",
    summary: "يُستفاد من وصية النص بالنساء واليتامى أن الكرامة والأمان لا يجوز أن يكونا موضع مساومة داخل الأسرة.",
    application: "تعاهدا أن لا يستغل أحدكما هشاشة الآخر أو حاجته، وأن يكون طلب المساندة والاعتراض في البيت بلا تخويف أو إهانة.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج5، كتاب 3، باب حق المرأة على الزوج، الحديث 3",
    sourceUrl: "https://thaqalayn.net/hadith/5/3/152/3",
    majlisiGrade: "موثق",
    shiaSourceLocation: "الكافي، ج5، كتاب 3، باب حق المرأة على الزوج، الحديث 3",
  },
  {
    id: "curated-hadith-good-character",
    text: "إِنَّ حُسْنَ الْخُلُقِ يَبْلُغُ بِصَاحِبِهِ دَرَجَةَ الصَّائِمِ الْقَائِمِ",
    summary: "يقدم النص حسن الخلق قيمة إيجابية مستقلة، لا مجرد امتناع عن الإساءة، ويصلح أساساً للمعاشرة اليومية باحترام.",
    application: "حددا سلوكاً بسيطاً من حسن الخلق تريدان ملاحظته هذا الأسبوع، مثل الإصغاء حتى النهاية أو خفض الصوت أو الاعتذار الواضح.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب حسن الخلق، الحديث 18",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/49/18",
    majlisiGrade: "حسن كالصحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب حسن الخلق، الحديث 18",
  },
  {
    id: "curated-hadith-fairness-and-support",
    text: "الْمُوَاسَاةُ فِي ذَاتِ يَدِهِ وَالْإِنْصَافُ مِنْ نَفْسِهِ",
    summary: "يجمع النص بين المساندة بحسب المتاح والإنصاف مع النفس؛ أي مراجعة القرار من زاوية حق الآخر لا من زاوية كسب النقاش.",
    application: "اختارا موقفاً يومياً، ثم يسأل كل منكما: ما الحق الذي قد أكون أغفلته للطرف الآخر، وما المساعدة التي أستطيع تقديمها بلا منّة؟",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب الإنصاف والعدل، الحديث 9",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/66/9",
    majlisiGrade: "حسن كالصحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب الإنصاف والعدل، الحديث 9",
  },
  {
    id: "curated-hadith-family-priority",
    text: "وَابْدَأْ بِمَنْ تَعُولُ",
    summary: "يرد النص في سياق يوازن الإيثار مع الكفاية، فيذكّر بأن رعاية الأسرة واحتياجاتها الأساسية لا تُهمل عند توزيع الوقت أو المال.",
    application: "عند ضغط الميزانية أو الوقت، راجعا الأولويات معاً: ما الاحتياجات الأساسية للأسرة أولاً، وكيف نتجنب أن يتحول العطاء أو الإنفاق إلى ضرر أو سيطرة؟",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج4، كتاب 1، باب الإيثار، الحديث 1",
    sourceUrl: "https://thaqalayn.net/hadith/4/1/15/1",
    majlisiGrade: "موثق",
    shiaSourceLocation: "الكافي، ج4، كتاب 1، باب الإيثار، الحديث 1",
  },
  {
    id: "curated-hadith-developmental-stages",
    text: "الْغُلَامُ يَلْعَبُ سَبْعَ سِنِينَ وَيَتَعَلَّمُ الْكِتَابَ سَبْعَ سِنِينَ وَيَتَعَلَّمُ الْحَلَالَ وَالْحَرَامَ سَبْعَ سِنِينَ",
    summary: "يلفت النص إلى اختلاف احتياجات الطفل عبر مراحل النمو، فلا تُقاس توقعات اللعب والتعلم وتحمل المسؤولية بمقياس واحد في كل عمر.",
    application: "راجعا توقعكما من الطفل وفق مرحلته: اتركا مساحة للعب، وقدما تعلماً تدريجياً، وتجنبا تفسير عدم النضج كأنه تحدٍ أو سوء نية.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج6، كتاب 1، باب آداب الطفل، الحديث 3",
    sourceUrl: "https://thaqalayn.net/hadith/6/1/33/3",
    majlisiGrade: "موثق",
    shiaSourceLocation: "الكافي، ج6، كتاب 1، باب آداب الطفل، الحديث 3",
  },
  {
    id: "curated-hadith-family-compassion",
    text: "إِنَّ اللَّهَ بَعَثَنِي بِالرَّحْمَةِ لَا بِالْعُقُوقِ",
    summary: "يُقدّم النص الرحمة والبر أصلاً في العلاقة مع الوالدين والأسرة الممتدة، بما يشمل الرفق في التواصل عند اختلاف الخلفيات أو الآراء.",
    application: "اختارا عبارة رحيمة للتواصل مع أحد الوالدين أو الأقارب عند اختلاف الرأي، مع إبقاء السلامة والحدود الشخصية مقدمة إذا كان التواصل مؤذياً أو قهرياً.",
    narrator: "رسول الله (ص)، برواية الإمام الرضا (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب بر الوالدين، الحديث 8",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/69/8",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب بر الوالدين، الحديث 8",
  },
  {
    id: "curated-hadith-honor-mother",
    text: "أُمَّكَ ... أُمَّكَ ... أُمَّكَ ... أَبَاكَ",
    summary: "يوجه النص إلى تقدير رعاية الوالدين، ويبدأ بتأكيد مكانة الأم؛ ويمكن أن يفتح حواراً عن الاعتراف بجهد الرعاية داخل البيت وعبر الأجيال.",
    application: "عبّرا عن تقدير محدد لجهد رعاية قدمته الأم أو الأب في العائلة، وتجنبا تحويل التقدير إلى مقارنة أو إنكار لجهد الطرف الآخر.",
    narrator: "رسول الله (ص)، برواية الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب بر الوالدين، الحديث 9",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/69/9",
    majlisiGrade: "حسن كالصحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب بر الوالدين، الحديث 9",
  },
];
const NON_SHIA_SOURCE_TEXTS = new Set([
  "إِذَا أَرَدْتَ الدُّخُولَ عَلَى أَهْلِكَ فَسَلِّمْ فَإِنَّهُ بَرَكَةٌ عَلَيْكَ وَعَلَى أَهْلِ بَيْتِكَ",
  "التَّوَدُّدُ إِلَى النَّاسِ نِصْفُ الْعَقْلِ",
  "إِنَّ اللَّهَ عَزَّ وَجَلَّ إِذَا أَحَبَّ أَهْلَ بَيْتٍ أَدْخَلَ عَلَيْهِمُ الرِّفْقَ",
  "لَا يَفْرَكْ مُؤْمِنٌ مُؤْمِنَةً، إِنْ كَرِهَ مِنْهَا خُلُقاً رَضِيَ مِنْهَا آخَرَ",
  "أَفْضَلُ الْأَعْمَالِ إِدْخَالُ السُّرُورِ عَلَى الْمُؤْمِنِ",
]);

// يعتمد النشر على درجة مجلسي مقبولة، أو على سند/موضع شيعي منشور قابل للتحقق؛ لا يكفي النقل التجميعي أو النص غير المسند.
export const HADITH_PUBLICATION_REVIEW: readonly HadithPublicationReview[] = originalHadiths.map(item => {
  const finding = MAJLISI_FINDINGS_BY_TEXT[item.text]
    ?? MAJLISI_FINDINGS_BY_ORIGINAL_REFERENCE[item.reference]
    ?? { majlisiGrade: "غير متحققة" as const };
  const gradeReason = finding.majlisiGrade === "ضعيف" || finding.majlisiGrade === "مرسل"
    ? `درجة العلّامة المجلسي المنشورة هي «${finding.majlisiGrade}».`
    : "لم تُتحقق بعد درجة العلّامة المجلسي لهذا النص في مكتبة ثقلين؛ فلا يصلح للاعتماد بهذا المعيار.";

  const hasAcceptedMajlisiEvidence = ACCEPTED_MAJLISI_GRADES.includes(finding.majlisiGrade)
    && Boolean(finding.shiaSourceUrl?.startsWith("https://"))
    && Boolean(finding.shiaSourceLocation?.trim())
    && Boolean(finding.gradingReferenceUrl?.startsWith("https://"));
  const hasVerifiedShiaChainEvidence = finding.publicationBasis === "verified_shia_chain"
    && Boolean(finding.shiaSourceUrl?.startsWith("https://"))
    && Boolean(finding.shiaSourceLocation?.trim());
  const hasPublishableEvidence = hasAcceptedMajlisiEvidence || hasVerifiedShiaChainEvidence;
  const publicationBasis = hasAcceptedMajlisiEvidence
    ? "majlisi_accepted" as const
    : hasVerifiedShiaChainEvidence
      ? "verified_shia_chain" as const
      : undefined;
  const reviewStatus: HadithReviewStatus = hasPublishableEvidence
    ? "accepted"
    : finding.majlisiGrade === "ضعيف" || finding.majlisiGrade === "مرسل"
      ? "rejected_weak_or_mursal"
      : NON_SHIA_SOURCE_TEXTS.has(item.text)
        ? "non_shia_source_identified"
        : finding.shiaSourceUrl
          ? "source_found_without_grade"
          : "source_or_attribution_unverified";
  const sourceEvidenceStatus: SourceEvidenceStatus = NON_SHIA_SOURCE_TEXTS.has(item.text)
    ? "non_shia_source_identified"
    : finding.shiaSourceUrl?.startsWith("https://thaqalayn.net/hadith/")
      ? "thaqalayn_direct"
      : finding.shiaSourceUrl
        ? "shia_alternate_or_text_variant"
        : "no_source_verified";

  return {
    text: item.text,
    speaker: item.speaker,
    originalSource: item.source,
    originalReference: item.reference,
    ...finding,
    publicationBasis,
    reviewStatus,
    sourceEvidenceStatus,
    decision: hasPublishableEvidence ? "approved" : "excluded",
    reason: hasPublishableEvidence
      ? publicationBasis === "majlisi_accepted"
        ? `درجة العلّامة المجلسي المنشورة هي «${finding.majlisiGrade}» مع موضع شيعي ورابط حكم قابلين للفتح؛ أُجيز النص «${item.reference}» للعرض.`
        : `ورد النص بسند أو موضع شيعي منشور قابل للتحقق؛ أُجيز النص «${item.reference}» للعرض وفق معيار السند الشيعي المعتمد.`
      : NON_SHIA_SOURCE_TEXTS.has(item.text)
        ? `أظهرت نتائج التحقق نسبة النص إلى مصادر غير شيعية، ولذلك استبعد النص «${item.reference}» من كتالوج الإنتاج.`
        : `${gradeReason} لذلك استبعد النص «${item.reference}» من كتالوج الإنتاج.`,
    thaqalaynSearchUrl: `https://thaqalayn.net/search?q=${encodeURIComponent(item.text)}&exact=1`,
  };
});

export function isPublishableShiaHadithReview(review: HadithPublicationReview) {
  const hasSource = Boolean(review.shiaSourceUrl?.startsWith("https://")) && Boolean(review.shiaSourceLocation?.trim());
  if (review.decision !== "approved" || !hasSource) return false;
  if (review.publicationBasis === "verified_shia_chain") return true;
  return review.publicationBasis === "majlisi_accepted"
    && ACCEPTED_MAJLISI_GRADES.includes(review.majlisiGrade)
    && Boolean(review.gradingReferenceUrl?.startsWith("https://"));
}

export function isApprovedShiaHadith(text: string) {
  const review = HADITH_PUBLICATION_REVIEW.find(item => item.text === text);
  return Boolean(review && isPublishableShiaHadithReview(review));
}

export function sourceUrlForApprovedShiaHadith(text: string) {
  const review = HADITH_PUBLICATION_REVIEW.find(item => item.text === text);
  return review && isPublishableShiaHadithReview(review) ? review.shiaSourceUrl : undefined;
}

export function approvedShiaHadithPresentation(text: string) {
  const review = HADITH_PUBLICATION_REVIEW.find(item => item.text === text);
  if (!review || !isPublishableShiaHadithReview(review)) return undefined;
  return {
    text: review.publishedText ?? review.text,
    narrator: review.publishedSpeaker,
    source: review.publishedSource,
    reference: review.publishedReference,
    sourceUrl: review.shiaSourceUrl,
  };
}
