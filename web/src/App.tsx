import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import TerrainPage from "./pages/TerrainPage";
import MoonNav from "../src/components/Nav";
import TeamPage from "./pages/TeamPage";

function App() {
  return (
    <BrowserRouter>
      <div className="ridgeline-page">

        {/* Global Lunar Navigation */}
        <MoonNav />

        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/terrain" element={<TerrainPage />} />
          <Route path="/team" element={<TeamPage />} />

          <Route path="*" element={<HomePage />} />
        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;