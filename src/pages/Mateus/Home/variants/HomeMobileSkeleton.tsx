import type { CSSProperties } from 'react';
import useProgressiveSource from '@/features/media/useProgressiveSource';
import portraitPreview from '@/assets/Mateus/home/hero-mobile-portrait-preview.webp';
import { MOBILE_PORTRAIT_LQIP } from '../data/heroPlaceholders';
import { localizeLabel } from '@/i18n/labels';
import i18n from '@/i18n/i18n';
import home from './HomeMobile.module.css';
import styles from './HomeMobileSkeleton.module.css';

function Text({text,className=''}:{text:string;className?:string}){
  return <span className={`${styles.text} ${className}`}>{localizeLabel(text)}</span>;
}

/**
 * Foto progressiva: a miniatura embutida aparece na hora (desfocada), troca
 * pela prévia pequena assim que ela chega e some quando a foto final entra.
 */
export function HomeMobilePortraitSkeleton(){
  const {src,stage}=useProgressiveSource(MOBILE_PORTRAIT_LQIP,portraitPreview);
  return <img className={`${home.portrait} ${styles.portrait}`} src={src} alt="" aria-hidden="true" width={1024} height={1536}
    draggable={false} data-home-portrait-skeleton="true" data-stage={stage}/>;
}

export default function HomeMobileSkeleton({className='',minHeight}:{className?:string;minHeight?:CSSProperties['minHeight']}){
  const isSpanish=(i18n.resolvedLanguage??'').startsWith('es');
  return <div className={`${home.page} ${styles.root} ${className}`} style={{minHeight}} aria-hidden="true" data-skeleton-variant="hero-mobile">
    <section className={home.hero}>
      <div className={home.eyebrow} data-home-skeleton-part="eyebrow">
        {['TECNOLOGIA','PESSOAS','IMPACTO'].map(text=><Text key={text} text={text}/>)}
      </div>
      <div className={home.title} data-home-skeleton-part="title">
        <Text text={isSpanish?'Engenheiro':'Senior'} className={`${home.titleLead} ${styles.lead}`}/>
        <Text text={isSpanish?'IA & Full Stack':'AI Engineer'} className={home.titleAccent}/>
      </div>
      <div className={home.identity} data-home-skeleton-part="identity">
        <strong><Text text="Mateus Cabral"/></strong>
        <Text text="Senior AI Engineer"/>
        <Text text="Remoto · CLT ou PJ" className={home.availability}/>
      </div>
      <p className={home.intro} data-home-skeleton-part="intro">
        {['Transformando','ideias em','produtos reais,','do código ao','impacto.'].map(text=><Text key={text} text={text} className={home.introLine}/>)}
      </p>
      <div className={home.partners} data-home-skeleton-part="partners">
        <div className={home.partnersHeading}><Text text="CLIENTES"/><Text text="E PARCEIROS"/></div>
        <div className={home.partnerLogos}>
          {['LinkedIn','Gmail','Claude','Codex'].map(text=><div key={text} className={home.partnerSignature}>
            <svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/></svg><Text text={text}/>
          </div>)}
        </div>
      </div>
      <HomeMobilePortraitSkeleton/>
      <nav className={home.actions} data-home-skeleton-part="actions">
        <a><svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/></svg><Text text="WhatsApp"/></a>
        <span className={home.actionDivider}/>
        <a><svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4"/></svg><Text text="Currículo"/></a>
      </nav>
    </section>
  </div>;
}
