import type { CSSProperties } from "react";

import bnbSeal from "@/assets/Mateus/Selos/BNB.svg";
import uniforSeal from "@/assets/Mateus/Selos/UNIFOR.svg";
import awsCertificationSeal from "@/assets/Mateus/Selos/aws-cloud-practitioner-horizontal-v2.svg";
import claudeCertificationSeal from "@/assets/Mateus/Selos/claude-certified-associate-horizontal-v2.svg";

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

// Contatos por idioma da página: a mensagem pronta do WhatsApp, o e-mail e o
// currículo seguem o idioma (pt Brasil, en internacional, es América Latina).
export type ContactLanguage = "pt" | "en" | "es";

export function resolveContactLanguage(language: string | undefined): ContactLanguage {
  const base = (language ?? "pt").toLowerCase().split("-")[0];
  return base === "en" || base === "es" ? base : "pt";
}

const WHATSAPP_NUMBER_URL = "https://wa.me/5585998575707";
const WHATSAPP_MESSAGES: Readonly<Record<ContactLanguage, string>> = {
  pt: "Olá Mateus, vi seu portfólio e gostaria de conversar.",
  en: "Hi Mateus, I saw your portfolio and would like to talk.",
  es: "Hola Mateus, vi su portafolio y me gustaría conversar.",
};

export function getWhatsAppHref(language: ContactLanguage): string {
  return `${WHATSAPP_NUMBER_URL}?text=${encodeURIComponent(WHATSAPP_MESSAGES[language])}`;
}

export const CONTACT_EMAIL = "contact@cabraiz.com";
const EMAIL_SUBJECTS: Readonly<Record<ContactLanguage, string>> = {
  pt: "Oportunidade para Mateus Cabral",
  en: "Opportunity for Mateus Cabral",
  es: "Oportunidad para Mateus Cabral",
};

export function getContactEmailHref(language: ContactLanguage): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECTS[language])}`;
}

// Link de agendamento (Calendly, Cal.com...). Preenchido, o botão principal
// em inglês vira "BOOK A CALL"; vazio, continua o e-mail.
export const BOOKING_URL = "";

export const RESUME_HREFS: Readonly<Record<ContactLanguage, string>> = {
  pt: "/files/mateus-cabral-resume.pdf",
  en: "/files/mateus-cabral-resume-en.pdf",
  es: "/files/mateus-cabral-resume-es.pdf",
};

export const WHATSAPP_HREF = getWhatsAppHref("pt");
export const RESUME_HREF = RESUME_HREFS.pt;

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
    key: "AWS_CERTIFIED",
    src: awsCertificationSeal,
    alt: "AWS Certified Cloud Practitioner",
    cat: cat3Icon,
  },
  {
    key: "CLAUDE_CERTIFIED",
    src: claudeCertificationSeal,
    alt: "Claude Certified Associate",
    cat: cat4Icon,
  },
];
