import React from "react";
import { Routes, Route } from "react-router-dom";

import RegisterHubLocal from "./pages/RegisterHubLocal/Register";
import LoginHubLocal from "./pages/LoginHubLocal/login";
import Hublocal from "./pages/Hublocal/Hublocal";
import Surprise from "./pages/Surprise/Surprise";
import Resume from "./pages/Resume/Resume";
import Doris from "./pages/Doris.mobi/principal";
import CasaNova from "./pages/CasaNova/CasaNova";

import { PrivateOutlet } from "./redux/shared/utils/PrivateOutlet";

import { RouteGuard } from "./components/RouteGuard";
import Libras from "./pages/Libras/Libras";
import Rosa from "./pages/Rosa/Rosa";
import Vinho from "./pages/Vinho/Vinho";
import Enigma from "./pages/Enigma/Enigma";
import DigitalCodeUnlock from "./components/DigitalCodeUnlock";
import Mateus from "./pages/Mateus/Mateus";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Página inicial padrão */}
      <Route path="/" element={<Mateus />} />

      {/* Página de introdução do enigma com botão */}
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

      {/* Outras rotas do app */}
      <Route path="/registerhublocal" element={<RegisterHubLocal />} />
      <Route path="/loginhublocal" element={<LoginHubLocal />} />
      <Route path="/resume" element={<Resume />} />
      <Route path="/doris" element={<Doris />} />
      <Route path="/casanova" element={<CasaNova />} />
      <Route path="/hublocal" element={<PrivateOutlet />}>
        <Route index element={<Hublocal />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
