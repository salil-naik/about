import { SiteLayout } from "./components/SiteLayout";
import About from "./pages/About";
import LifePainterly from "./pages/LifePainterly";
import Learn, { indiaCohort, LearnPage } from "./pages/Learn";
import Thoughts from "./pages/Thoughts";

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";

  if (path === "/life" || path === "/life/painterly") {
    document.title = "Life";
    return <LifePainterly />;
  }

  if (path === "/learn") {
    document.title = "Learn with Salil";
    return <Learn />;
  }

  if (path === "/course") {
    document.title = "Learn with Salil · India";
    return <LearnPage c={indiaCohort} />;
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
