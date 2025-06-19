import { Routes, Route } from "react-router-dom";

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

import { PrivateOutlet } from "../redux/shared/utils/PrivateOutlet";
import { RouteGuard } from "../components/RouteGuard";
import DigitalCodeUnlock from "../components/DigitalCodeUnlock";

import LandingPage from "../pages/Mateus/LandingPage/LandingPage"; // <-- 🚀 Aqui

const AppRoutes = () => {
  return (
    <Routes>
      {/* ✅ Landing page (home) */}
      <Route path="/" element={<LandingPage />} />

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
