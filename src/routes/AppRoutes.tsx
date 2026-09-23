import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  getHomeGameLandingRedirectPath,
  HOME_DRIVE_ROUTE_PATH,
  HOME_ELEVATOR_ROUTE_PATH,
  isHomeDriveStandaloneHost,
  isHomeElevatorStandaloneHost,
} from "../App/appHostRouting";

import { PrivateOutlet } from "../redux/shared/utils/PrivateOutlet";
import { RouteGuard } from "../components/RouteGuard";
import DigitalCodeUnlock from "../components/DigitalCodeUnlock";

const RegisterHubLocal = lazy(() => import("../pages/RegisterHubLocal/Register"));
const LoginHubLocal = lazy(() => import("../pages/LoginHubLocal/login"));
const Hublocal = lazy(() => import("../pages/Hublocal/Hublocal"));
const Resume = lazy(() => import("../pages/Resume/Resume"));
const Doris = lazy(() => import("../pages/Doris.mobi/principal"));
const CasaNova = lazy(() => import("../pages/CasaNova/CasaNova"));
const Surprise = lazy(() => import("../pages/Surprise/Surprise"));
const Enigma = lazy(() => import("../pages/Enigma/Enigma"));
const Libras = lazy(() => import("../pages/Libras/Libras"));
const Rosa = lazy(() => import("../pages/Rosa/Rosa"));
const Vinho = lazy(() => import("../pages/Vinho/Vinho"));
const LandingRouterPage = lazy(
  () => import("../pages/Mateus/LandingPage/LandingRouterPage"),
);
const HomeDriveStandalonePage = lazy(
  () => import("../pages/Mateus/Home/Drive/HomeDriveStandalonePage"),
);
const HomeElevatorStandalonePage = lazy(
  () => import("../pages/Mateus/Home/Elevator/HomeElevatorStandalonePage"),
);

const routeFallback = (
  <div
    aria-label="Carregando página"
    role="status"
    style={{ minHeight: "100dvh", background: "#050505" }}
  />
);

const AppRoutes = () => {
  const landingElement = isHomeDriveStandaloneHost() ? (
    <Navigate to={HOME_DRIVE_ROUTE_PATH} replace />
  ) : isHomeElevatorStandaloneHost() ? (
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

      <Route path={HOME_DRIVE_ROUTE_PATH} element={<HomeDriveStandalonePage />} />
      <Route
        path={HOME_ELEVATOR_ROUTE_PATH}
        element={<HomeElevatorStandalonePage />}
      />

      <Route path="/home" element={landingElement} />
      <Route path="/portfolio" element={landingElement} />
      <Route path="/roadmap" element={landingElement} />
      <Route path="/technologies" element={landingElement} />
      <Route path="/pricing" element={<Navigate to="/technologies" replace />} />
      <Route path="/live" element={landingElement} />
      <Route path="/contact" element={landingElement} />

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
      <Route path="/casanova" element={<CasaNova />} />
      <Route path="/surprise" element={<Surprise />} />

      <Route path="/hublocal" element={<PrivateOutlet />}>
        <Route index element={<Hublocal />} />
      </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
