import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NavigatePage from "./pages/Navigate/NavigatePage";

function App() {
  return (
    <BrowserRouter>
      <div className="ridgeline-page">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/navigate" element={<NavigatePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;