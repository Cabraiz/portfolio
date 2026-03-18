export type PartnerItem = Readonly<{
  id: string;
  name: string;
  imageSrc?: string;
  imageAlt?: string;
  href?: string;
}>;

export const partners: ReadonlyArray<PartnerItem> = [
  {
    id: "bank-of-the-northeast",
    name: "Banco do Nordeste",
    imageSrc: "/images/partners/bnb.svg",
    imageAlt: "Logo do Banco do Nordeste",
    href: "https://www.bnb.gov.br",
  },
  {
    id: "unifor",
    name: "Unifor",
    imageSrc: "/images/partners/unifor.svg",
    imageAlt: "Logo da Unifor",
    href: "https://www.unifor.br",
  },
  {
    id: "sirius",
    name: "Sirius",
    imageSrc: "/images/partners/sirius.svg",
    imageAlt: "Logo da Sirius",
    href: "https://www.sirius.int",
  },
  {
    id: "fcamara",
    name: "FCamara",
    imageSrc: "/images/partners/fcamara.svg",
    imageAlt: "Logo da FCamara",
    href: "https://fcamara.com.br",
  },
];

export default partners;
