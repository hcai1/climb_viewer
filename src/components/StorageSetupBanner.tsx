export default function StorageSetupBanner() {
  return (
    <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
      <p className="font-medium">Climb storage is not connected yet</p>
      <p className="mt-2 text-amber-100/90">
        Vercel cannot save files to disk. Connect Blob storage once, then
        redeploy:
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-amber-100/90">
        <li>
          Open your project on{" "}
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            vercel.com
          </a>
        </li>
        <li>
          Go to <strong>Storage → Create Database → Blob</strong> (or open your
          existing Blob store)
        </li>
        <li>
          On the store&apos;s <strong>Projects</strong> tab, click{" "}
          <strong>Connect to Project</strong> and select this app
        </li>
        <li>
          Redeploy from <strong>Deployments → … → Redeploy</strong>
        </li>
      </ol>
      <p className="mt-3 text-xs text-amber-100/70">
        After connecting, Vercel adds <code className="text-amber-50">BLOB_STORE_ID</code>{" "}
        (and related auth vars). The warning should disappear on the next deploy.
      </p>
    </div>
  );
}
