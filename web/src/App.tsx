import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import TerrainPage from "./pages/TerrainPage";
import MoonNav from "../src/components/Nav";
import TeamPage from "./pages/TeamPage";
import ValidationPage from "./pages/ValidationPage";
import SettingsProvider from "./lib/SettingsProvider";
import PlanProvider from "./lib/PlanProvider";
import PlanPage from "./pages/PlanPage";

function App() {
  return (
    <SettingsProvider>
    <PlanProvider>
    <BrowserRouter>
      <div className="ridgeline-page">

        {/* Global Lunar Navigation */}
        <MoonNav />

        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/terrain" element={<TerrainPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/validation" element={<ValidationPage />} />

          <Route path="*" element={<HomePage />} />
        </Routes>

      </div>
    </BrowserRouter>
    </PlanProvider>
    </SettingsProvider>
  );
}

export default App;