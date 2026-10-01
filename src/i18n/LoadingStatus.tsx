import { useTranslation } from 'react-i18next';
import { localizeLabel } from './labels';

export default function LoadingStatus({ label }: { label: string }) {
  // A Suspense fallback must remain usable while its own translations are loading.
  useTranslation(undefined, { useSuspense: false });
  return <div aria-label={localizeLabel(label)} role="status" style={{ minHeight: '100dvh', background: '#050505' }} />;
}
