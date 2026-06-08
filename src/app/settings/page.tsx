import { redirect } from "next/navigation";
import SiteProfileForm from "@/components/SiteProfileForm";
import { isAdmin } from "@/lib/auth";
import { getSiteProfile } from "@/lib/site-profile-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {
  if (!isAdmin()) {
    redirect("/login?next=/settings");
  }

  const profile = await getSiteProfile();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-mountain-100">Site settings</h1>
      <p className="mt-2 text-mountain-300">
        Personalize what visitors see — your name, intro, and site title. Only
        you can change these after signing in.
      </p>
      <div className="mt-8 rounded-2xl border border-mountain-700/60 bg-mountain-900/40 p-6">
        <SiteProfileForm initial={profile} />
      </div>
    </div>
  );
}
