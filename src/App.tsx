import { SiteLayout } from "./components/SiteLayout";
import About from "./pages/About";
import Life from "./pages/Life";
import LifeCanvas from "./pages/LifeCanvas";
import LifePainterly from "./pages/LifePainterly";
import Thoughts from "./pages/Thoughts";

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";

  if (path === "/life/crayon") {
    document.title = "Life — Crayon";
    return <Life />;
  }

  if (path === "/life/canvas") {
    document.title = "Life — Canvas";
    return <LifeCanvas />;
  }

  if (path === "/life" || path === "/life/painterly") {
    document.title = "Life";
    return <LifePainterly />;
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
