import type { LandingSectionId } from '../../features/navigation/landingSections';
import homePaper from '../../assets/icones/brand-textures/home-paper-v1.svg';
import portfolioMineral from '../../assets/icones/brand-textures/portfolio-mineral-v1.svg';
import servicesBrass from '../../assets/icones/brand-textures/services-brass-v1.svg';
import networkBlue from '../../assets/icones/brand-textures/network-blue-v1.svg';
import photosSilver from '../../assets/icones/brand-textures/photos-silver-v1.svg';

const materials = {
  home: { name: 'paper', texture: homePaper, color: '#962b43', shadow: 'drop-shadow(0 0 .45px rgba(255, 229, 214, .8))' },
  portfolio: { name: 'mineral', texture: portfolioMineral, color: '#3c8078', shadow: 'drop-shadow(0 1px .6px rgba(17, 62, 57, .15))' },
  roadMap: { name: 'brass', texture: servicesBrass, color: '#bf9444', shadow: 'drop-shadow(0 1px .6px rgba(0, 0, 0, .2))' },
  technologies: { name: 'blue', texture: networkBlue, color: '#2b527d', shadow: 'drop-shadow(0 1px .6px rgba(20, 45, 73, .15))' },
  contact: { name: 'silver', texture: photosSilver, color: '#bbc9cc', shadow: 'drop-shadow(0 1px .6px rgba(0, 0, 0, .2))' },
};

/** Both navigation variants use the same material, keeping the original mark. */
export function getBrandMaterial(sectionId: LandingSectionId | '') {
  return materials[sectionId === 'live' ? 'contact' : sectionId || 'home'];
}
