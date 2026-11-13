import { useState, useEffect } from "react";
import "./App.css";
import HomePage from "./pages/HomePage";
import Navigator from "./pages/Navigator";

function App() {
  const [currentRoute, setCurrentRoute] = useState<"home" | "navigator">("home");

  // Synchronize with URL hash (e.g. #navigator or default #)
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#navigator") {
        setCurrentRoute("navigator");
      } else {
        setCurrentRoute("home");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const navigateTo = (route: "home" | "navigator") => {
    window.location.hash = route === "navigator" ? "navigator" : "";
    setCurrentRoute(route);
  };

  return (
    <div className="ridgeline-page">
      {currentRoute === "home" ? (
        <div className="relative">
          <HomePage />
          {/* Subtle bottom-docked launch banner linking into Navigator */}
          <div className="fixed bottom-6 right-6 z-40 max-md:bottom-4 max-md:right-4">
            <button
              type="button"
              onClick={() => navigateTo("navigator")}
              className="flex items-center gap-3 bg-[#ff3d18] hover:bg-[#ff4d2b] text-white px-5 py-3 shadow-[0_0_25px_rgba(255,61,24,0.4)] border border-white/20 transition-all duration-300 hover:-translate-y-1 group"
            >
              <span className="font-['Michroma'] text-[10px] tracking-[1.5px] uppercase">
                Launch Site Navigator
              </span>
              <span className="text-[14px] transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </div>
      ) : (
        <Navigator onBack={() => navigateTo("home")} />
      )}
    </div>
  );
}

export default App;
