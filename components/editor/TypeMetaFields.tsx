"use client";

import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import type { PostType } from "@prisma/client";

interface TypeMetaFieldsProps {
  type: PostType;
  meta: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export default function TypeMetaFields({ type, meta, onChange }: TypeMetaFieldsProps) {
  if (type === "thirukkural") {
    return (
      <div className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h3 className="text-sm font-sans font-semibold text-stone-700">Thirukkural Details</h3>
        <Input
          label="Kural Number (1–1330)"
          type="number"
          min={1}
          max={1330}
          value={meta.kuralNumber ?? ""}
          onChange={(e) => onChange("kuralNumber", e.target.value)}
          placeholder="e.g. 1"
        />
        <Textarea
          label="Tamil Couplet"
          value={meta.tamilCouplet ?? ""}
          onChange={(e) => onChange("tamilCouplet", e.target.value)}
          placeholder="குறட்பா…"
          className="font-serif text-base leading-relaxed"
          rows={3}
        />
        <Textarea
          label="English Translation"
          value={meta.englishTranslation ?? ""}
          onChange={(e) => onChange("englishTranslation", e.target.value)}
          placeholder="English translation of the couplet…"
          rows={3}
        />
        <Textarea
          label="Tamil Commentary (optional)"
          value={meta.tamilCommentary ?? ""}
          onChange={(e) => onChange("tamilCommentary", e.target.value)}
          placeholder="Tamil commentary…"
          rows={4}
        />
        <Textarea
          label="English Commentary (optional)"
          value={meta.englishCommentary ?? ""}
          onChange={(e) => onChange("englishCommentary", e.target.value)}
          placeholder="English commentary…"
          rows={4}
        />
      </div>
    );
  }

  if (type === "letter") {
    return (
      <div className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h3 className="text-sm font-sans font-semibold text-stone-700">Letter Details</h3>
        <Input
          label="Recipient / Office"
          value={meta.recipient ?? ""}
          onChange={(e) => onChange("recipient", e.target.value)}
          placeholder="e.g. The Editor, The Hindu"
        />
        <Input
          label="Letter Date"
          type="date"
          value={meta.letterDate ?? ""}
          onChange={(e) => onChange("letterDate", e.target.value)}
        />
        <Input
          label="Response / Status (optional)"
          value={meta.responseStatus ?? ""}
          onChange={(e) => onChange("responseStatus", e.target.value)}
          placeholder="e.g. Published, No response"
        />
      </div>
    );
  }

  if (type === "linkedin_post") {
    return (
      <div className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h3 className="text-sm font-sans font-semibold text-stone-700">LinkedIn Post Details</h3>
        <Input
          label="LinkedIn URL (canonical source)"
          type="url"
          value={meta.linkedInUrl ?? ""}
          onChange={(e) => onChange("linkedInUrl", e.target.value)}
          placeholder="https://linkedin.com/posts/…"
        />
        <Input
          label="Original Post Date"
          type="date"
          value={meta.originalDate ?? ""}
          onChange={(e) => onChange("originalDate", e.target.value)}
        />
      </div>
    );
  }

  if (type === "business_idea") {
    return (
      <div className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h3 className="text-sm font-sans font-semibold text-stone-700">Business Idea Details</h3>
        <Textarea
          label="Free-use notice (shown to readers)"
          value={meta.freeUseNotice ?? "These ideas are free for anyone to take and build. No attribution or credit required."}
          onChange={(e) => onChange("freeUseNotice", e.target.value)}
          rows={3}
        />
      </div>
    );
  }

  // article — no extra fields
  return null;
}
