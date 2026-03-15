import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
    const locale = await getLocale();
    redirect(`/${locale}/admin/events`);
}
