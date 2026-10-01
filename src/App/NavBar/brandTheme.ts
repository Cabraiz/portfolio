import type { LandingSectionId } from '../../features/navigation/landingSections';
import homeCotton from '../../assets/icones/brand-textures/home-cotton-v2.webp';
import homeWhiteCotton from '../../assets/icones/brand-textures/home-white-cotton-v3.webp';
import portfolioCarpet from '../../assets/icones/brand-textures/portfolio-carpet-v2.webp';
import servicesSuede from '../../assets/icones/brand-textures/services-suede-v2.webp';
import networkDenim from '../../assets/icones/brand-textures/network-denim-v2.webp';
import photosFelt from '../../assets/icones/brand-textures/photos-felt-v2.webp';

const materials = {
  home: { name: 'cotton', texture: homeCotton, color: '#a84b60', brightness: 1.4 },
  portfolio: { name: 'carpet', texture: portfolioCarpet, color: '#367b71', brightness: 1 },
  roadMap: { name: 'suede', texture: servicesSuede, color: '#bc862c', brightness: 1 },
  technologies: { name: 'denim', texture: networkDenim, color: '#30597f', brightness: 1 },
  contact: { name: 'felt', texture: photosFelt, color: '#b4bcc0', brightness: 1 },
};

const desktopHomeMaterial = { name: 'cotton', texture: homeWhiteCotton, color: '#f1f1ee', brightness: 1 };

/** Section textiles share the original mark; desktop Home uses white cotton. */
export function getBrandMaterial(sectionId: LandingSectionId | '', mobile = false) {
  if (!mobile && (!sectionId || sectionId === 'home')) return desktopHomeMaterial;
  return materials[sectionId === 'live' ? 'contact' : sectionId || 'home'];
}
