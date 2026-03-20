import type { CSSProperties } from "react";

import perfil from "../../assets/Mateus/perfil.webp";
import IconGmail from "../../assets/Mateus/icon/IconGmail.png";
import IconInsta from "../../assets/Mateus/icon/IconInsta.png";
import IconLinkendin from "../../assets/Mateus/icon/IconLinkedIn.png";
import IconWhatsApp from "../../assets/Mateus/icon/IconWhatsApp.png";
import IconMeet from "../../assets/Mateus/icon/IconMeet.png";

import seloBNB from "../../assets/Mateus/Selos/BNB.svg";
import seloUNIFOR from "../../assets/Mateus/Selos/UNIFOR.svg";
import seloSANA from "../../assets/Mateus/Selos/SANA.svg";
import seloSEDIH from "../../assets/Mateus/Selos/SEDIH.svg";

import cat1 from "../../assets/Mateus/cutieIcons/Cat1.png";
import cat2 from "../../assets/Mateus/cutieIcons/Cat2.png";
import cat3 from "../../assets/Mateus/cutieIcons/Cat3.png";
import cat4 from "../../assets/Mateus/cutieIcons/Cat4.png";

export type SealItem = Readonly<{
  key: string;
  src: string;
  alt: string;
  cat: string;
  style?: CSSProperties;
}>;

export const COMPACT_DESKTOP_MEDIA_QUERY =
  "(max-height: 1080px) and (min-width: 961px)";

export const WHATSAPP_HREF = "https://wa.me/5585998575707";
export const MEET_HREF = "https://meet.google.com/SEULINK";
export const RESUME_HREF = "/files/mateus-cabral-resume.pdf";

export const PROFILE_IMAGE = perfil;

export const SOCIAL_ICONS = {
  gmail: IconGmail,
  instagram: IconInsta,
  linkedin: IconLinkendin,
  whatsapp: IconWhatsApp,
  meet: IconMeet,
} as const;

export const seals: readonly SealItem[] = [
  {
    key: "BNB",
    src: seloBNB,
    alt: "Banco do Nordeste",
    cat: cat1,
    style: { scale: "0.9", marginTop: "5px" },
  },
  {
    key: "UNIFOR",
    src: seloUNIFOR,
    alt: "UNIFOR",
    cat: cat2,
  },
  {
    key: "SANA",
    src: seloSANA,
    alt: "SANA",
    cat: cat3,
    style: { scale: "0.75", marginTop: "5px" },
  },
  {
    key: "SEDIH",
    src: seloSEDIH,
    alt: "SEDIH",
    cat: cat4,
  },
];
