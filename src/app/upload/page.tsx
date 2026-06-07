import GpxUploadForm from "@/components/GpxUploadForm";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-mountain-100">Upload a climb</h1>
      <p className="mt-2 text-mountain-300">
        Drop a GPX file from Garmin, Strava export, or any GPS app. Heart rate
        and cadence extensions are parsed automatically when present.
      </p>
      <div className="mt-8">
        <GpxUploadForm />
      </div>
    </div>
  );
}
