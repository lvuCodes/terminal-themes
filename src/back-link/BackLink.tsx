import "./back-link.css";

// Back link to the author's home page. Overlays the page's top-left corner so
// it never displaces the content below it.
export function BackLink({
  href = "https://lvucodes.github.io",
  label = "← Home",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <nav className="back-nav">
      <a className="pill" href={href}>
        {label}
      </a>
    </nav>
  );
}
