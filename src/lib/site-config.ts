export interface SiteProfile {
  ownerName: string;
  siteTitle: string;
  tagline: string;
  bio: string;
  footer: string;
}

const DEFAULTS: SiteProfile = {
  ownerName: "Peak Paths",
  siteTitle: "Peak Paths",
  tagline: "Mountain climbs, mapped in 3D",
  bio: "A collection of summit days — routes, elevation, and stats from the trail.",
  footer: "Built for climbers — GPX in, 3D terrain out.",
};

export function getDefaultSiteProfile(): SiteProfile {
  const ownerName =
    process.env.NEXT_PUBLIC_SITE_OWNER_NAME?.trim() || DEFAULTS.ownerName;

  return {
    ownerName,
    siteTitle:
      process.env.NEXT_PUBLIC_SITE_TITLE?.trim() ||
      (ownerName !== DEFAULTS.ownerName ? `${ownerName}'s Climbs` : DEFAULTS.siteTitle),
    tagline:
      process.env.NEXT_PUBLIC_SITE_TAGLINE?.trim() || DEFAULTS.tagline,
    bio: process.env.NEXT_PUBLIC_SITE_BIO?.trim() || DEFAULTS.bio,
    footer:
      process.env.NEXT_PUBLIC_SITE_FOOTER?.trim() || DEFAULTS.footer,
  };
}

export function mergeSiteProfile(
  stored: Partial<SiteProfile> | null,
  defaults: SiteProfile
): SiteProfile {
  if (!stored) return defaults;

  return {
    ownerName: stored.ownerName?.trim() || defaults.ownerName,
    siteTitle: stored.siteTitle?.trim() || defaults.siteTitle,
    tagline: stored.tagline?.trim() || defaults.tagline,
    bio: stored.bio?.trim() || defaults.bio,
    footer: stored.footer?.trim() || defaults.footer,
  };
}
