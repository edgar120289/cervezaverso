import { SITE } from "@/lib/site";

/** URL anterior del feed: se conserva por si algo ya apunta a ella. */
export function GET() {
  return Response.redirect(`${SITE.url}/feed/google.xml`, 308);
}
