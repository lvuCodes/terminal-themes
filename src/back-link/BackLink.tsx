import "./BackLink.css";

export type BackLinkProps = {
  href?: string;
  label?: string;
};

export function BackLink({ href = "https://lvucodes.github.io", label = "← Home" }: BackLinkProps) {
  return (
    <nav className="back-nav">
      <a className="back-link" href={href}>
        {label}
      </a>
    </nav>
  );
}
