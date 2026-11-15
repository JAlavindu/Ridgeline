import "./App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import MoonNav from "./components/Nav";
import PlanProvider from "./lib/PlanProvider";
import SettingsProvider from "./lib/SettingsProvider";

const HomePage = lazy(() => import("./pages/HomePage"));
const TerrainPage = lazy(() => import("./pages/TerrainPage"));
const PlanPage = lazy(() => import("./pages/PlanPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const ValidationPage = lazy(() => import("./pages/ValidationPage"));

function Loading() {
  return (
    <p className="min-h-screen bg-[#020202] px-6 pt-28 text-[13px] text-white/40">
      Loading…
    </p>
  );
}

function App() {
  return (
    <SettingsProvider>
      <PlanProvider>
        <BrowserRouter>
          <div className="ridgeline-page">
            <MoonNav />

            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/terrain" element={<TerrainPage />} />
                <Route path="/plan" element={<PlanPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/validation" element={<ValidationPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </PlanProvider>
    </SettingsProvider>
  );
}

export default App;