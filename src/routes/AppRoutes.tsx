import { Suspense, lazy, useEffect } from "react";
import LoadingStatus from '../i18n/LoadingStatus';
import { Navigate, Route, Routes } from "react-router-dom";
import {
  getHomeGameLandingRedirectPath,
  HOME_ELEVATOR_ROUTE_PATH,
  isHomeElevatorStandaloneHost,
} from "../App/appHostRouting";

import { PrivateOutlet } from "../redux/shared/utils/PrivateOutlet";
import { RouteGuard } from "../components/RouteGuard";
import DigitalCodeUnlock from "../components/DigitalCodeUnlock";

/** Links e QR codes antigos de /casanova seguem para o site novo. */
function CasaNovaRedirect() {
  useEffect(() => {
    window.location.replace(
      `https://casanova.cabraiz.com/${window.location.search}${window.location.hash}`,
    );
  }, []);
  return null;
}

const RegisterHubLocal = lazy(() => import("../pages/RegisterHubLocal/Register"));
const LoginHubLocal = lazy(() => import("../pages/LoginHubLocal/login"));
const Hublocal = lazy(() => import("../pages/Hublocal/Hublocal"));
const Resume = lazy(() => import("../pages/Resume/Resume"));
const Doris = lazy(() => import("../pages/Doris.mobi/principal"));
const Surprise = lazy(() => import("../pages/Surprise/Surprise"));
const Enigma = lazy(() => import("../pages/Enigma/Enigma"));
const Libras = lazy(() => import("../pages/Libras/Libras"));
const Rosa = lazy(() => import("../pages/Rosa/Rosa"));
const Vinho = lazy(() => import("../pages/Vinho/Vinho"));
const LandingRouterPage = lazy(
  () => import("../pages/Mateus/LandingPage/LandingRouterPage"),
);
const HomeElevatorStandalonePage = lazy(
  () => import("../pages/Mateus/Home/Elevator/HomeElevatorStandalonePage"),
);

const PrivacyNotice = lazy(() => import("../pages/Privacy/PrivacyNotice"));

const routeFallback = <LoadingStatus label="Carregando página" />;

const AppRoutes = () => {
  const landingElement = isHomeElevatorStandaloneHost() ? (
    <Navigate to={HOME_ELEVATOR_ROUTE_PATH} replace />
  ) : (
    <LandingRouterPage />
  );

  return (
    <Suspense fallback={routeFallback}>
      <Routes>
      <Route
        path="/"
        element={<Navigate to={getHomeGameLandingRedirectPath()} replace />}
      />

      {/* A lista de presentes Casa Nova mudou para casanova.cabraiz.com. */}
      <Route path="/casanova/*" element={<CasaNovaRedirect />} />
      {/* O jogo de carro mudou para drive.cabraiz.com. */}
      <Route path="/drive" element={<Navigate to="/home" replace />} />
      <Route
        path={HOME_ELEVATOR_ROUTE_PATH}
        element={<HomeElevatorStandalonePage />}
      />

      <Route path="/home" element={landingElement} />
      <Route path="/portfolio" element={landingElement} />
      <Route path="/servicos" element={landingElement} />
      <Route path="/roadmap" element={<Navigate to="/servicos" replace />} />
      <Route path="/technologies" element={landingElement} />
      <Route path="/pricing" element={<Navigate to="/technologies" replace />} />
      <Route path="/live" element={<Navigate to="/technologies" replace />} />
      <Route path="/contact" element={landingElement} />

      {/* Aviso de privacidade (LGPD/GDPR), um endereço por idioma. */}
      <Route path="/aviso-de-privacidade" element={<PrivacyNotice />} />
      <Route path="/en/privacy-notice" element={<PrivacyNotice />} />
      <Route path="/es/aviso-de-privacidad" element={<PrivacyNotice />} />

      {/* Versão em inglês com endereço próprio (hreflang en). */}
      <Route path="/en" element={<Navigate to="/en/home" replace />} />
      <Route path="/en/home" element={landingElement} />
      <Route path="/en/portfolio" element={landingElement} />
      <Route path="/en/*" element={<Navigate to="/en/home" replace />} />

      {/* Versão em espanhol (América Latina), hreflang es. */}
      <Route path="/es" element={<Navigate to="/es/home" replace />} />
      <Route path="/es/home" element={landingElement} />
      <Route path="/es/portfolio" element={landingElement} />
      <Route path="/es/*" element={<Navigate to="/es/home" replace />} />

      <Route path="/enigma" element={<Enigma />} />

      <Route
        path="/libras-unlock"
        element={<DigitalCodeUnlock routeKey="libras" next="/libras" />}
      />
      <Route
        path="/libras"
        element={
          <RouteGuard routeKey="libras">
            <Libras />
          </RouteGuard>
        }
      />

      <Route
        path="/rosa-unlock"
        element={<DigitalCodeUnlock routeKey="rosa" next="/rosa" />}
      />
      <Route
        path="/rosa"
        element={
          <RouteGuard routeKey="rosa">
            <Rosa />
          </RouteGuard>
        }
      />

      <Route
        path="/vinho-unlock"
        element={<DigitalCodeUnlock routeKey="vinho" next="/vinho" />}
      />
      <Route
        path="/vinho"
        element={
          <RouteGuard routeKey="vinho">
            <Vinho />
          </RouteGuard>
        }
      />

      <Route path="/registerhublocal" element={<RegisterHubLocal />} />
      <Route path="/loginhublocal" element={<LoginHubLocal />} />

      <Route path="/resume" element={<Resume />} />

      <Route path="/doris" element={<Doris />} />
      <Route path="/surprise" element={<Surprise />} />

      <Route path="/hublocal" element={<PrivateOutlet />}>
        <Route index element={<Hublocal />} />
      </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
