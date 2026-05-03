import { Navigate, Route, Routes } from "react-router-dom";

import RegisterHubLocal from "../pages/RegisterHubLocal/Register";
import LoginHubLocal from "../pages/LoginHubLocal/login";
import Hublocal from "../pages/Hublocal/Hublocal";
import Resume from "../pages/Resume/Resume";
import Doris from "../pages/Doris.mobi/principal";
import CasaNova from "../pages/CasaNova/CasaNova";
import Surprise from "../pages/Surprise/Surprise";

import Enigma from "../pages/Enigma/Enigma";
import Libras from "../pages/Libras/Libras";
import Rosa from "../pages/Rosa/Rosa";
import Vinho from "../pages/Vinho/Vinho";
import LandingRouterPage from "../pages/Mateus/LandingPage/LandingRouterPage";
import HomeDriveStandalonePage from "../pages/Mateus/Home/Drive/HomeDriveStandalonePage";
import {
  getHomeDriveLandingRedirectPath,
  isHomeDriveStandaloneHost,
} from "../App/appHostRouting";

import { PrivateOutlet } from "../redux/shared/utils/PrivateOutlet";
import { RouteGuard } from "../components/RouteGuard";
import DigitalCodeUnlock from "../components/DigitalCodeUnlock";

const AppRoutes = () => {
  const isDriveHost = isHomeDriveStandaloneHost();
  const landingElement = isDriveHost ? (
    <Navigate to="/drive" replace />
  ) : (
    <LandingRouterPage />
  );

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={getHomeDriveLandingRedirectPath()} replace />}
      />

      <Route path="/drive" element={<HomeDriveStandalonePage />} />

      <Route path="/home" element={landingElement} />
      <Route path="/portfolio" element={landingElement} />
      <Route path="/roadmap" element={landingElement} />
      <Route path="/pricing" element={landingElement} />
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
  );
};

export default AppRoutes;


