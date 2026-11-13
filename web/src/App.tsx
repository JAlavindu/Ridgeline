import "./App.css";
import HomePage from "./pages/HomePage";
import Navigator from "./pages/Navigator";

function App() {
  return (
    <div className="ridgeline-page bg-[#020202] text-white min-h-screen">
      <HomePage />
      <section id="navigator" className="bg-[#020617] text-white border-t border-slate-800">
        <Navigator />
      </section>
    </div>
  );
}

export default App;
