import type { CSSProperties } from "react";

import profileImage from "@/assets/Mateus/perfil.webp";
import gmailIcon from "@/assets/Mateus/Icon/IconGmail.png";
import instagramIcon from "@/assets/Mateus/Icon/IconInsta.png";
import linkedInIcon from "@/assets/Mateus/Icon/IconLinkedIn.png";
import whatsAppIcon from "@/assets/Mateus/Icon/IconWhatsApp.png";
import meetIcon from "@/assets/Mateus/Icon/IconMeet.png";
import whatsappQrSvg from "@/assets/Mateus/QRCode/whatsapp-contact-qr.svg";

import bnbSeal from "@/assets/Mateus/Selos/BNB.svg";
import uniforSeal from "@/assets/Mateus/Selos/UNIFOR.svg";
import sanaSeal from "@/assets/Mateus/Selos/SANA.svg";
import sedihSeal from "@/assets/Mateus/Selos/SEDIH.svg";

import cat1Icon from "@/assets/Mateus/cutieIcons/Cat1.png";
import cat2Icon from "@/assets/Mateus/cutieIcons/Cat2.png";
import cat3Icon from "@/assets/Mateus/cutieIcons/Cat3.png";
import cat4Icon from "@/assets/Mateus/cutieIcons/Cat4.png";

export type SealItem = Readonly<{
  key: string;
  src: string;
  alt: string;
  cat: string;
  style?: CSSProperties;
}>;

export const COMPACT_DESKTOP_MEDIA_QUERY =
  "(max-height: 1080px) and (min-width: 961px)";

export const WHATSAPP_HREF =
  "https://wa.me/5585998575707?text=Ol%C3%A1%20Mateus%2C%20vi%20seu%20portf%C3%B3lio%20e%20gostaria%20de%20conversar.";
export const MEET_HREF = "https://meet.google.com/SEULINK";
export const RESUME_HREF = "/files/mateus-cabral-resume.pdf";

export const WHATSAPP_QR_SRC = whatsappQrSvg;
export const WHATSAPP_QR_ALT =
  "QR Code para abrir conversa com Mateus no WhatsApp";

export const MEET_QR_POPOVER_TITLE = "Escaneie e fale comigo no WhatsApp";
export const MEET_QR_POPOVER_SUBTITLE =
  "Aponte a câmera para o QR Code ou abra a conversa diretamente pelo botão abaixo.";
export const MEET_QR_POPOVER_CTA_LABEL = "Abrir conversa";

export const PROFILE_IMAGE = profileImage;

export const SOCIAL_ICONS = {
  gmail: gmailIcon,
  instagram: instagramIcon,
  linkedin: linkedInIcon,
  whatsapp: whatsAppIcon,
  meet: meetIcon,
} as const;

export const seals: readonly SealItem[] = [
  {
    key: "BNB",
    src: bnbSeal,
    alt: "Banco do Nordeste",
    cat: cat1Icon,
    style: {
      scale: "0.9",
      marginTop: "5px",
    },
  },
  {
    key: "UNIFOR",
    src: uniforSeal,
    alt: "UNIFOR",
    cat: cat2Icon,
  },
  {
    key: "SANA",
    src: sanaSeal,
    alt: "SANA",
    cat: cat3Icon,
    style: {
      scale: "0.75",
      marginTop: "5px",
    },
  },
  {
    key: "SEDIH",
    src: sedihSeal,
    alt: "SEDIH",
    cat: cat4Icon,
  },
];
