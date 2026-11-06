import { SiteLayout } from "./components/SiteLayout";
import About from "./pages/About";
import Life from "./pages/Life";
import Thoughts from "./pages/Thoughts";

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";

  if (path === "/life") {
    document.title = "Life";
    return <Life />;
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
