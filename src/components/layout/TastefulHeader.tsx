import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export function TastefulHeader() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'));

  useEffect(() => {
    // Initialize from localStorage with dark as default
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const next = stored ?? 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    setTheme(next);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <header className="t-site-header" id="top">
      <div className="t-container t-header-inner">
        <Link to="/" className="t-brand" aria-label="Homepage" onClick={() => setOpen(false)}>
          <img src={import.meta.env.BASE_URL + 'favicon.svg'} alt="" className="t-brand-mark" />
          <span className="t-brand-name">Streetwise</span>
        </Link>
        <button
          className="t-nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
        <nav id="site-nav" className={`t-site-nav ${open ? "open" : ""}`} aria-label="Primary">
          <a href="#home" onClick={() => setOpen(false)}>Home</a>
          <a href="#about" onClick={() => setOpen(false)}>About</a>
          <a href="#features" onClick={() => setOpen(false)}>Features</a>
          <a href="#contact" onClick={() => setOpen(false)}>Contact</a>
        </nav>
        <button className="t-btn t-btn-ghost" onClick={toggleTheme} aria-label="Toggle dark mode">
          {theme === 'dark' ? '☀︎ Light' : '🌙 Dark'}
        </button>
      </div>
    </header>
  );
}
