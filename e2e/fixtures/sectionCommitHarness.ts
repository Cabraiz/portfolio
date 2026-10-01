/* eslint-disable @eslint-react/dom-no-flush-sync -- Test-only fixture forces distinct commits within one cooldown. */
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import useLandingCommittedSection from '../../src/pages/Mateus/LandingPage/hooks/useLandingCommittedSection';
import type { LandingSectionId } from '../../src/features/navigation/landingSections';

const observation = (section: LandingSectionId) => ({
  observed: section,
  observations: (['home', 'portfolio', 'contact'] as const).map(id => ({
    sectionId: id, score: id === section ? 100 : 0,
    visibilityRatio: id === section ? 1 : 0,
    distanceToActivationLine: id === section ? 0 : 1000,
    rectTop: 0, rectBottom: 844, rectHeight: 844, timestamp: performance.now(),
  })),
});
const root = createRoot(document.getElementById('fixture')!);

function Harness() {
  const [state, setState] = useState<ReturnType<typeof observation>>({observed:'home', observations:[]});
  const [disabled, setDisabled] = useState(false);
  const result = useLandingCommittedSection({observedSectionId:state.observed,
    observations:state.observations, defaultSectionId:'home', viewportMode:'mobile', disabled});
  const { setCommittedSectionId } = result;
  useEffect(() => {
    Reflect.set(window, 'commitHarness', {
      observe: (section: LandingSectionId) => flushSync(() => setState(observation(section))),
      sync: (section: LandingSectionId) => flushSync(() => setCommittedSectionId(section)),
      rapid: () => {
        flushSync(() => setState(observation('home')));
        flushSync(() => setState(observation('portfolio')));
      },
      disable: () => flushSync(() => setDisabled(true)),
      unmount: () => root.unmount(),
    });
  }, [setCommittedSectionId]);
  return React.createElement('output', {'data-committed':result.committedSectionId}, result.committedSectionId);
}

root.render(React.createElement(Harness));
