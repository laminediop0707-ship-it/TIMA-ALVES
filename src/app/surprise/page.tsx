import type { Metadata } from "next";
import { getDraft, getPublished, type PublishedContent } from "@/lib/content";
import { buildSlideSnapshot } from "@/lib/media";
import { getAdminSession, hasSurpriseSession } from "@/lib/sessions";
import { SurpriseExperience } from "./experience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ta surprise 💗",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ preview?: string }>;

export default async function SurprisePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { preview } = await searchParams;
  const isPreview = preview === "1";

  // The gate copy is public so the "door" itself stays admin-editable; the
  // rest of the content is only sent once the name has been unlocked.
  const published = await getPublished();

  // Preview is only available to a signed-in administrator.
  if (isPreview) {
    const admin = await getAdminSession();
    if (admin) {
      const draft = await getDraft();
      const slides = await buildSlideSnapshot();
      const content: PublishedContent = { ...draft, slides };
      return (
        <SurpriseExperience
          initialContent={content}
          gateTexts={draft.gate}
          initialUnlocked
          preview
        />
      );
    }
  }

  const unlocked = await hasSurpriseSession();

  return (
    <SurpriseExperience
      initialContent={unlocked ? published : null}
      gateTexts={published.gate}
      initialUnlocked={unlocked}
      preview={false}
    />
  );
}
