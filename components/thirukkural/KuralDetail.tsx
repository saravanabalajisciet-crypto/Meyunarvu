/**
 * Bilingual Thirukkural layout — approved spec:
 *
 * Desktop (md+):
 *   Left column  — Tamil couplet, Tamil commentary
 *   Right column — English translation, English commentary
 *   CSS Grid grid-cols-2 with a subtle divider
 *
 * Mobile (< md):
 *   Single column, Tamil content FIRST, then English
 *   No language toggle — ever.
 */

interface KuralDetailProps {
  kuralNumber?: number | null;
  tamilCouplet: string;
  englishTranslation: string;
  tamilCommentary?: string | null;
  englishCommentary?: string | null;
}

export default function KuralDetail({
  kuralNumber,
  tamilCouplet,
  englishTranslation,
  tamilCommentary,
  englishCommentary,
}: KuralDetailProps) {
  const hasCommentary = tamilCommentary || englishCommentary;

  return (
    <div className="space-y-10">

      {/* Kural number */}
      {kuralNumber != null && (
        <p className="text-xs font-sans font-semibold text-brand uppercase tracking-[0.18em]">
          Kural {kuralNumber}
        </p>
      )}

      {/* ── Couplet section ───────────────────────────────────────────────────
          Mobile:  Tamil couplet → English translation (stacked, Tamil first)
          Desktop: Tamil couplet | English translation (side-by-side grid)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-10 md:divide-x md:divide-stone-100">

        {/* LEFT / FIRST — Tamil couplet (always first in DOM = first on mobile) */}
        <div className="pb-6 md:pb-0 md:pr-10 border-b border-stone-100 md:border-b-0">
          <p className="text-xs font-sans font-semibold text-brand uppercase tracking-[0.15em] mb-4">
            Tamil
          </p>
          <blockquote className="font-serif text-2xl sm:text-3xl leading-[1.7] text-stone-900 whitespace-pre-line tamil">
            {tamilCouplet}
          </blockquote>
        </div>

        {/* RIGHT / SECOND — English translation */}
        <div className="pt-6 md:pt-0 md:pl-10">
          <p className="text-xs font-sans font-semibold text-stone-400 uppercase tracking-[0.15em] mb-4">
            English
          </p>
          <blockquote className="font-serif text-2xl sm:text-3xl leading-[1.7] text-stone-600 whitespace-pre-line">
            {englishTranslation}
          </blockquote>
        </div>
      </div>

      {/* ── Commentary section ────────────────────────────────────────────────
          Same column order rule: Tamil commentary first, English second.
      ─────────────────────────────────────────────────────────────────────── */}
      {hasCommentary && (
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-10 md:divide-x md:divide-stone-100 pt-8 border-t border-stone-100">

          {/* LEFT / FIRST — Tamil commentary */}
          <div className="pb-6 md:pb-0 md:pr-10 border-b border-stone-100 md:border-b-0">
            {tamilCommentary ? (
              <>
                <p className="text-xs font-sans font-semibold text-brand uppercase tracking-[0.15em] mb-4">
                  விளக்கம்
                </p>
                <div className="font-serif text-base leading-relaxed text-stone-700 whitespace-pre-line tamil">
                  {tamilCommentary}
                </div>
              </>
            ) : (
              <div className="hidden md:block" /> /* keeps grid alignment */
            )}
          </div>

          {/* RIGHT / SECOND — English commentary */}
          <div className="pt-6 md:pt-0 md:pl-10">
            {englishCommentary ? (
              <>
                <p className="text-xs font-sans font-semibold text-stone-400 uppercase tracking-[0.15em] mb-4">
                  Commentary
                </p>
                <div className="font-serif text-base leading-relaxed text-stone-600 whitespace-pre-line">
                  {englishCommentary}
                </div>
              </>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
