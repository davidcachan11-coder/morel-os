import { getHomepageContent, getNavContent } from "@/content/provider";
import { SectionRenderer } from "@/components/homepage/section-renderer";
import { SiteFooter } from "@/components/site-footer";

/**
 * Sprint 7 (Premium Storefront Redesign) — the homepage is now a
 * data-driven list of sections rather than hardcoded marketing JSX. All
 * copy, imagery, and section order comes from content/homepage.ts via
 * getHomepageContent() (content/provider.ts); reordering, editing, or
 * eventually admin-managing the homepage never touches this file.
 */
export default async function LandingPage() {
  const [content, navContent] = await Promise.all([getHomepageContent(), getNavContent()]);

  return (
    <div className="flex flex-1 flex-col">
      {content.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
      <SiteFooter navContent={navContent} />
    </div>
  );
}
