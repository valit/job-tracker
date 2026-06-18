import { redirect } from "next/navigation";

export default function JobDeepLink({ params }: { params: { id: string } }) {
  redirect(`/?view=jobs&job=${params.id}`);
}
