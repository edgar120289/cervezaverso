import { listPublicVideos, MEDIA_DIRS, publicFileExists } from "@/lib/media";
import HeroCinematic from "./HeroCinematic";

export default function Hero() {
  // Prioridad: public/hero-beer.mp4 → primer video de public/video/hero/ → sin video (fondo oscuro).
  const videoSrc = publicFileExists(MEDIA_DIRS.heroVideo)
    ? `/${MEDIA_DIRS.heroVideo}`
    : listPublicVideos(MEDIA_DIRS.heroVideos)[0];

  return <HeroCinematic videoSrc={videoSrc} />;
}
