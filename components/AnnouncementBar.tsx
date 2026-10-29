import { getAnnouncement } from "@/lib/announcement-server";
import AnnouncementBarView from "./AnnouncementBarView";

/** Barra negra de arriba: se edita en /admin/landing. No es fija: se va con el scroll (el header sí es fijo). */
export default async function AnnouncementBar() {
  const data = await getAnnouncement();
  if (!data.enabled) return null;
  return <AnnouncementBarView messages={data.messages} href={data.href} homeOnly={data.scope === "home"} />;
}
