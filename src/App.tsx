import { SiteLayout } from "./components/SiteLayout";
import About from "./pages/About";
import LifePainterly from "./pages/LifePainterly";
import Learn from "./pages/Learn";
import "./pages/learn2.css";
import Thoughts from "./pages/Thoughts";

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";

  if (path === "/life" || path === "/life/painterly") {
    document.title = "Life";
    return <LifePainterly />;
  }

  if (path === "/learn" || path === "/learn2") {
    document.title = "Learn with Salil";
    return <Learn skin={path === "/learn2" ? "arcade" : "classic"} />;
  }

  document.title = "Salil Naik";

  if (path === "/" || path === "/thoughts") {
    return (
      <SiteLayout>
        {path === "/" ? <About /> : <Thoughts />}
      </SiteLayout>
    );
  }

  return <main>Page not found.</main>;
}
