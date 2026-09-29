"use client";

import { motion } from "framer-motion";
import { CONTACT } from "@/lib/site";
import { WhatsAppIcon } from "./SocialIcons";


export default function WhatsAppFAB() {
  return (
    <motion.a
      href={CONTACT.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-card"
    >
      <WhatsAppIcon size={28} className="text-white" />
    </motion.a>
  );
}
