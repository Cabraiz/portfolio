import { useLayoutEffect, useRef } from 'react';
import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import styles from './Portfolio.module.css';

type Props = { year: string; technologies: readonly string[] };

export default function MobileProjectMeta({ year, technologies }: Props) {
  useLabelLanguage();
  const rowRef = useRef<HTMLDivElement>(null);
  const labels = [year, ...technologies].map(label => localizeLabel(label));
  const labelSignature = labels.join('\0');

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const chips = Array.from(row.children) as HTMLElement[];
    const fit = () => {
      const available = row.clientWidth;
      const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 0;
      let used = 0;
      let overflowing = false;
      for (const [index, chip] of chips.entries()) {
        used += (index ? gap : 0) + chip.getBoundingClientRect().width;
        overflowing ||= used > available + 0.5;
        chip.dataset.overflowHidden = String(overflowing);
        if (overflowing) chip.setAttribute('aria-hidden', 'true');
        else chip.removeAttribute('aria-hidden');
      }
    };
    fit();
    // Visibility preserves chip measurements, so wider layouts can reveal them again.
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    chips.forEach(chip => observer.observe(chip));
    return () => observer.disconnect();
  }, [labelSignature]);

  return (
    <div ref={rowRef} className={`${styles.mobileMeta} ${styles.mobileTechnologies}`}
      data-mobile-meta="true" data-mobile-technologies="true" aria-label={localizeLabel('Tecnologias')}>
      {labels.map(label => <span key={label}>{label}</span>)}
    </div>
  );
}
