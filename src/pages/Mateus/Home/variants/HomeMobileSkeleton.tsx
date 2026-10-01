import type { CSSProperties } from 'react';
import { localizeLabel } from '@/i18n/labels';
import home from './HomeMobile.module.css';
import styles from './HomeMobileSkeleton.module.css';

function Text({text,className=''}:{text:string;className?:string}){
  return <span className={`${styles.text} ${className}`}>{localizeLabel(text)}</span>;
}

export function HomeMobilePortraitSkeleton(){
  return <svg className={`${home.portrait} ${styles.portrait}`} viewBox="0 0 1024 1536" aria-hidden="true" data-home-portrait-skeleton="true">
    <ellipse cx="560" cy="380" rx="220" ry="290" />
    <path d="M430 620H690L730 730C915 795 995 925 1024 1130V1536H115L190 1020C235 865 315 770 410 735Z" />
  </svg>;
}

export default function HomeMobileSkeleton({className='',minHeight}:{className?:string;minHeight?:CSSProperties['minHeight']}){
  return <div className={`${home.page} ${styles.root} ${className}`} style={{minHeight}} aria-hidden="true" data-skeleton-variant="hero-mobile">
    <section className={home.hero}>
      <div className={home.eyebrow} data-home-skeleton-part="eyebrow">
        {['TECNOLOGIA','PESSOAS','IMPACTO'].map(text=><Text key={text} text={text}/>)}
      </div>
      <div className={home.title} data-home-skeleton-part="title">
        <Text text="Dev" className={`${home.titleLead} ${styles.lead}`}/>
        <Text text="Back-End & APIs" className={home.titleAccent}/>
      </div>
      <div className={home.identity} data-home-skeleton-part="identity">
        <strong><Text text="Mateus Cabral"/></strong>
        <Text text="Engenheiro de Software"/><Text text="Fundador"/>
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
