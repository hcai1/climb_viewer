import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EditClimbForm from "@/components/EditClimbForm";
import { isAdmin } from "@/lib/auth";
import { getClimb } from "@/lib/storage";

export const dynamic = "force-dynamic";

type PageProps = { params: { id: string } };

export default async function EditClimbPage({ params }: PageProps) {
  if (!isAdmin()) {
    redirect(`/login?next=/climbs/${params.id}/edit`);
  }

  const climb = await getClimb(params.id);
  if (!climb) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/climbs/${climb.id}`}
        className="text-sm text-mountain-400 transition hover:text-summit-400"
      >
        ← Back to climb
      </Link>
      <h1 className="mt-4 font-display text-3xl text-mountain-100">Edit climb</h1>
      <p className="mt-2 text-mountain-300">
        Update the name, date, description, or replace the GPX track.
      </p>
      <div className="mt-8">
        <EditClimbForm
          climb={{
            id: climb.id,
            name: climb.name,
            description: climb.description,
            date: climb.date,
          }}
        />
      </div>
    </div>
  );
}
