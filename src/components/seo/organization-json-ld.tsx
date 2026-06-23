import { buildOrganizationJsonLd } from "@/lib/metadata/site-branding";

export function OrganizationJsonLd() {
  const data = buildOrganizationJsonLd();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
