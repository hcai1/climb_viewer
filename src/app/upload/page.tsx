import { redirect } from "next/navigation";
import GpxUploadForm from "@/components/GpxUploadForm";
import { getAdminPassword, isAdmin } from "@/lib/auth";

export default function UploadPage() {
  if (!getAdminPassword()) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl text-mountain-100">Upload disabled</h1>
        <p className="mt-2 text-mountain-300">
          Set <code className="text-summit-400">ADMIN_PASSWORD</code> in{" "}
          <code className="text-summit-400">.env.local</code> to enable owner
          uploads.
        </p>
      </div>
    );
  }

  if (!isAdmin()) {
    redirect("/login?next=/upload");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-mountain-100">Upload a climb</h1>
      <p className="mt-2 text-mountain-300">
        You&apos;re signed in as the owner. Uploads are saved permanently and
        appear for all visitors on the home page.
      </p>
      <div className="mt-8">
        <GpxUploadForm />
      </div>
    </div>
  );
}
