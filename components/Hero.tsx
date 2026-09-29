import { listPublicImages, listPublicVideos, MEDIA_DIRS, publicFileExists } from "@/lib/media";
import HeroCinematic, { type HeroSlide } from "./HeroCinematic";

/** "03-azteca.png" → "Azteca" */
function labelFromFilename(src: string): string {
  const name = src.split("/").pop()!.replace(/\.[^.]+$/, "").replace(/^\d+-/, "");
  const words = name.split("-").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default function Hero() {
  const slides: HeroSlide[] = listPublicImages(MEDIA_DIRS.tarros).map((src) => ({
    src,
    label: labelFromFilename(src),
  }));
  // Prioridad: public/hero-beer.mp4 → primer video de public/video/hero/ → sin video (fondo Canvas Mist).
  const videoSrc = publicFileExists(MEDIA_DIRS.heroVideo)
    ? `/${MEDIA_DIRS.heroVideo}`
    : listPublicVideos(MEDIA_DIRS.heroVideos)[0];

  return <HeroCinematic slides={slides} videoSrc={videoSrc} />;
}
