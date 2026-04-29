// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.commerceNames.ts

import type {
  HomeDriveBuildingKind,
  HomeDriveBuildingMaterialKey,
} from "./homeDrive.building.types";

export type HomeDriveCommerceCategory =
  | "bakery"
  | "market"
  | "pharmacy"
  | "cafe"
  | "bar"
  | "restaurant"
  | "auto-parts"
  | "hardware"
  | "salon"
  | "tech"
  | "clothing"
  | "gym"
  | "clinic"
  | "petshop"
  | "bank"
  | "office"
  | "warehouse"
  | "generic";

export type HomeDriveCommerceSignStyle =
  | "painted"
  | "neon"
  | "panel"
  | "classic"
  | "market"
  | "pharmacy"
  | "vertical"
  | "industrial"
  | "glass";

export type HomeDriveCommerceAwningStyle =
  | "none"
  | "flat"
  | "striped"
  | "metal"
  | "fabric";

export type HomeDriveCommerceDescriptor = Readonly<{
  category: HomeDriveCommerceCategory;
  name: string;
  signStyle: HomeDriveCommerceSignStyle;
  awningStyle: HomeDriveCommerceAwningStyle;
  seed: number;
}>;

export type HomeDriveCommerceNameInput = Readonly<{
  id: string;
  kind: HomeDriveBuildingKind;
  materialKey?: HomeDriveBuildingMaterialKey;
  variant: number;
  roadId: string;
  segmentId: string;
  districtId?: string;
}>;

const COMMERCE_NAMES: Readonly<Record<HomeDriveCommerceCategory, readonly string[]>> =
  Object.freeze({
    bakery: Object.freeze([
      "Padaria Sol",
      "Pão da Esquina",
      "Forno Quente",
      "Padaria Aurora",
      "Pão & Café",
      "Casa do Pão",
      "Panificadora Luz",
      "Trigo Nobre",
      "Pão Central",
      "Massa Fina",
      "Pão de Açúcar",
      "Forno do Bairro",
    ]),

    market: Object.freeze([
      "Mercadinho Avenida",
      "Mini Preço",
      "Mercantil São José",
      "Mercado Popular",
      "Bom Vizinho",
      "Compra Certa",
      "Mercadinho Sol",
      "Tudo Aqui",
      "Super Bairro",
      "Cesta Boa",
      "Preço Bom",
      "Mercado Central",
    ]),

    pharmacy: Object.freeze([
      "Farmácia Central",
      "Drogaria Vida",
      "Farmácia Popular",
      "Saúde Já",
      "Drogaria Avenida",
      "Farma Sol",
      "Drogaria União",
      "Farmácia Iracema",
      "Farma Mais",
      "Bem Estar",
      "Drogaria Forte",
      "Farma Norte",
    ]),

    cafe: Object.freeze([
      "Café Iracema",
      "Café do Centro",
      "Grão Urbano",
      "Café Aurora",
      "Café da Praça",
      "Expresso 85",
      "Café Atlântico",
      "Casa do Café",
      "Café Nobre",
      "Café Meireles",
      "Café Benfica",
      "Café Solar",
    ]),

    bar: Object.freeze([
      "Bar do Chico",
      "Boteco Avenida",
      "Bar do Porto",
      "Esquina Gelada",
      "Bar Central",
      "Boteco do Mar",
      "Balcão 85",
      "Bar da Praça",
      "Ponto Gelado",
      "Mesa Livre",
      "Bar Iracema",
      "Boteco Forte",
    ]),

    restaurant: Object.freeze([
      "Sabor da Cidade",
      "Restaurante Avenida",
      "Cantinho Nordestino",
      "Prato Feito",
      "Casa do Almoço",
      "Sabor Iracema",
      "Bistrô Central",
      "Panela Quente",
      "Tempero Bom",
      "Esquina Gourmet",
      "Sabor Caseiro",
      "Mesa do Sol",
    ]),

    "auto-parts": Object.freeze([
      "Auto Peças Fortaleza",
      "Peças Avenida",
      "Motor Norte",
      "Oficina Central",
      "Auto Center 85",
      "Rodas & Cia",
      "Peças Rápidas",
      "Mecânica Sol",
      "Garage Forte",
      "Auto União",
      "Pneu Fácil",
      "Motor Forte",
    ]),

    hardware: Object.freeze([
      "Ferragens União",
      "Casa das Ferramentas",
      "Material Avenida",
      "Constru Forte",
      "Ferragem Central",
      "Tudo Obra",
      "Depósito São José",
      "Parafuso & Cia",
      "Casa do Mestre",
      "Obra Fácil",
      "Tinta & Cimento",
      "Rei da Obra",
    ]),

    salon: Object.freeze([
      "Studio Bela",
      "Salão Avenida",
      "Corte Fino",
      "Barbearia Central",
      "Espaço Mulher",
      "Studio 85",
      "Barbearia Iracema",
      "Bela Forma",
      "Cabelo & Arte",
      "Navalha Nobre",
      "Salão Sol",
      "Corte Urbano",
    ]),

    tech: Object.freeze([
      "Tech Point",
      "Info Center",
      "Byte Store",
      "Celular Express",
      "Digital Norte",
      "Smart Fix",
      "PC Rápido",
      "Tech Avenida",
      "Info Sol",
      "Conecta Store",
      "Click Digital",
      "Mobile Lab",
    ]),

    clothing: Object.freeze([
      "Moda Avenida",
      "Loja Central",
      "Estilo Urbano",
      "Vitrine 85",
      "Roupa Boa",
      "Moda Praia",
      "Bella Moda",
      "Estação Fashion",
      "Look Certo",
      "Arara Azul",
      "Vitrine Forte",
      "Moda Sol",
    ]),

    gym: Object.freeze([
      "Academia Forte",
      "Corpo Ativo",
      "Gym Avenida",
      "Movimento Fit",
      "Arena Fitness",
      "Força Urbana",
      "Fit Center",
      "Treino Livre",
      "Studio Corpo",
      "Power 85",
      "Forma Total",
      "Treino Forte",
    ]),

    clinic: Object.freeze([
      "Clínica Vida",
      "Centro Médico Sol",
      "Saúde Central",
      "Clínica Avenida",
      "Consultório Norte",
      "Vida Plena",
      "Med Center",
      "Clínica Iracema",
      "Bem Cuidar",
      "Saúde Já",
      "Clínica Forte",
      "Med Popular",
    ]),

    petshop: Object.freeze([
      "Pet Avenida",
      "Mundo Pet",
      "Bicho Feliz",
      "Pet Central",
      "Casa Animal",
      "Pet Sol",
      "Amigo Pet",
      "Pet Shop 85",
      "Patas & Cia",
      "Animal Care",
      "Pet Forte",
      "Bicho Bom",
    ]),

    bank: Object.freeze([
      "Banco Popular",
      "Agência Central",
      "Caixa Urbana",
      "Banco Avenida",
      "Crédito Fácil",
      "Financeira Sol",
      "Ponto Banco",
      "Banco Forte",
      "Agência Norte",
      "Conta Certa",
      "Banco Atlântico",
      "CredMais",
    ]),

    office: Object.freeze([
      "Torre Empresarial",
      "Centro Office",
      "Edifício Prime",
      "Business Center",
      "Office Avenida",
      "Corporate 85",
      "Centro Executivo",
      "Torre Atlântico",
      "Edifício Norte",
      "Smart Offices",
      "Torre Iracema",
      "Office Forte",
    ]),

    warehouse: Object.freeze([
      "Depósito Central",
      "Galpão Avenida",
      "Log Forte",
      "Carga Norte",
      "Distribuidora Sol",
      "Armazém 85",
      "Logística Central",
      "Galpão União",
      "Estoque Rápido",
      "Base Operacional",
      "Carga Forte",
      "Centro Logístico",
    ]),

    generic: Object.freeze([
      "Loja Avenida",
      "Comercial São José",
      "Ponto Central",
      "Casa Forte",
      "Espaço Urbano",
      "Loja do Bairro",
      "Comercial Sol",
      "Centro Popular",
      "Ponto Certo",
      "Nova Loja",
      "Comercial Norte",
      "Galeria Sol",
    ]),
  });

const COMMERCE_SUFFIXES: readonly string[] = Object.freeze([
  "",
  "",
  "",
  "24h",
  "Express",
  "Center",
  "Prime",
  "Popular",
  "Fortaleza",
  "Delivery",
]);

export function getHomeDriveStableStringSeed(value: string, salt = 0): number {
  let hash = 2166136261 ^ salt;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

function pickSeeded<T>(items: readonly T[], seed: number, fallback: T): T {
  if (items.length <= 0) {
    return fallback;
  }

  const index = Math.min(
    items.length - 1,
    Math.floor(Math.max(0, Math.min(0.999999, seed)) * items.length),
  );

  return items[index] ?? fallback;
}

function getDistrictPreferredCategories(
  districtId: string | undefined,
): readonly HomeDriveCommerceCategory[] {
  switch (districtId) {
    case "centro":
      return [
        "bank",
        "pharmacy",
        "market",
        "tech",
        "office",
        "restaurant",
        "cafe",
        "clothing",
      ];

    case "aldeota":
    case "meireles":
      return [
        "cafe",
        "restaurant",
        "clinic",
        "gym",
        "clothing",
        "office",
        "pharmacy",
        "petshop",
      ];

    case "praia-de-iracema":
      return ["bar", "restaurant", "cafe", "clothing", "market", "generic"];

    case "benfica":
      return ["cafe", "bar", "restaurant", "tech", "market", "bakery", "generic"];

    case "castelao":
      return [
        "bar",
        "restaurant",
        "auto-parts",
        "hardware",
        "market",
        "warehouse",
        "generic",
      ];

    default:
      return [
        "market",
        "bakery",
        "pharmacy",
        "cafe",
        "restaurant",
        "hardware",
        "salon",
        "generic",
      ];
  }
}

function getBuildingKindPreferredCategories(
  kind: HomeDriveBuildingKind,
): readonly HomeDriveCommerceCategory[] {
  switch (kind) {
    case "commerce":
      return [
        "market",
        "bakery",
        "pharmacy",
        "cafe",
        "bar",
        "restaurant",
        "tech",
        "clothing",
        "salon",
        "petshop",
        "generic",
      ];

    case "office":
      return ["office", "bank", "clinic", "tech", "gym"];

    case "warehouse":
      return ["warehouse", "hardware", "auto-parts", "market"];

    case "apartment":
      return ["market", "bakery", "pharmacy", "cafe", "salon", "generic"];

    case "house":
    default:
      return ["generic", "bakery", "market", "salon"];
  }
}

export function shouldHomeDriveBuildingHaveCommerceSign(
  building: HomeDriveCommerceNameInput,
): boolean {
  if (building.kind === "commerce" || building.kind === "office") {
    return true;
  }

  if (building.kind === "warehouse") {
    const seed = getHomeDriveStableStringSeed(`${building.id}:warehouse-sign`, 17);

    return seed > 0.22;
  }

  if (building.kind === "apartment") {
    const seed = getHomeDriveStableStringSeed(`${building.id}:apartment-sign`, 23);

    return seed > 0.68;
  }

  if (building.kind === "house") {
    const seed = getHomeDriveStableStringSeed(`${building.id}:house-sign`, 29);

    return seed > 0.88;
  }

  return false;
}

export function pickHomeDriveCommerceCategory(
  building: HomeDriveCommerceNameInput,
): HomeDriveCommerceCategory {
  const districtCategories = getDistrictPreferredCategories(building.districtId);
  const kindCategories = getBuildingKindPreferredCategories(building.kind);

  const mixedCategories = [
    ...kindCategories,
    ...districtCategories,
    ...kindCategories.slice(0, 3),
  ];

  const seed = getHomeDriveStableStringSeed(
    `${building.id}:${building.roadId}:${building.segmentId}:category:${building.variant}`,
    41,
  );

  return pickSeeded<HomeDriveCommerceCategory>(
    mixedCategories,
    seed,
    "generic",
  );
}

export function pickHomeDriveCommerceSignStyle(
  category: HomeDriveCommerceCategory,
  building: HomeDriveCommerceNameInput,
): HomeDriveCommerceSignStyle {
  if (category === "pharmacy") {
    return "pharmacy";
  }

  if (category === "market") {
    return "market";
  }

  if (category === "warehouse" || building.kind === "warehouse") {
    return "industrial";
  }

  if (building.kind === "office") {
    return "glass";
  }

  const seed = getHomeDriveStableStringSeed(
    `${building.id}:sign-style:${building.variant}`,
    53,
  );

  if (seed > 0.84) {
    return "vertical";
  }

  if (seed > 0.66) {
    return "neon";
  }

  if (seed > 0.44) {
    return "panel";
  }

  if (seed > 0.22) {
    return "classic";
  }

  return "painted";
}

export function pickHomeDriveCommerceAwningStyle(
  category: HomeDriveCommerceCategory,
  building: HomeDriveCommerceNameInput,
): HomeDriveCommerceAwningStyle {
  if (building.kind !== "commerce" && building.kind !== "apartment") {
    return "none";
  }

  if (
    category === "bank" ||
    category === "office" ||
    category === "warehouse" ||
    category === "clinic"
  ) {
    return "none";
  }

  const seed = getHomeDriveStableStringSeed(
    `${building.id}:awning:${building.variant}`,
    67,
  );

  if (seed > 0.78) {
    return "striped";
  }

  if (seed > 0.54) {
    return "fabric";
  }

  if (seed > 0.32) {
    return "flat";
  }

  if (seed > 0.16) {
    return "metal";
  }

  return "none";
}

export function getHomeDriveCommerceDescriptor(
  building: HomeDriveCommerceNameInput,
): HomeDriveCommerceDescriptor {
  const category = pickHomeDriveCommerceCategory(building);
  const signStyle = pickHomeDriveCommerceSignStyle(category, building);
  const awningStyle = pickHomeDriveCommerceAwningStyle(category, building);

  const nameSeed = getHomeDriveStableStringSeed(
    `${building.id}:${category}:name:${building.variant}`,
    79,
  );

  const suffixSeed = getHomeDriveStableStringSeed(
    `${building.id}:${category}:suffix:${building.variant}`,
    83,
  );

  const baseName = pickSeeded(
    COMMERCE_NAMES[category],
    nameSeed,
    COMMERCE_NAMES.generic[0],
  );

  const suffix = pickSeeded(COMMERCE_SUFFIXES, suffixSeed, "");

  return {
    category,
    name: suffix ? `${baseName} ${suffix}` : baseName,
    signStyle,
    awningStyle,
    seed: getHomeDriveStableStringSeed(`${building.id}:descriptor`, 97),
  };
}
