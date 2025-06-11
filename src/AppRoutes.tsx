// AppRoutes.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import RegisterHubLocal from "./pages/RegisterHubLocal/Register";
import LoginHubLocal from "./pages/LoginHubLocal/login";
import Hublocal from "./pages/Hublocal/Hublocal";
import Surprise from "./pages/Surprise/Surprise";
import Resume from "./pages/Resume/Resume";
import Doris from "./pages/Doris.mobi/principal";
import CasaNova from "./pages/CasaNova/CasaNova";
import Mateus from "./pages/Mateus/Mateus";

import { PrivateOutlet } from "./redux/shared/utils/PrivateOutlet";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Mateus />} />
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
