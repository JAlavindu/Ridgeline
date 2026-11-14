import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { lunarSites } from "./data/lunarSites";
import HomePage from "./pages/HomePage";
import TerrainPage from "./pages/TerrainPage";

function App() {
  return (
    <BrowserRouter>
      <div className="ridgeline-page">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/terrain" element={<TerrainPage sites={lunarSites} />} />

          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;