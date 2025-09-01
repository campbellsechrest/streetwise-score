export function TastefulFooter() {
  return (
    <footer className="t-site-footer">
      <div className="t-container t-footer-inner">
        <span>
          Campbell Fulham © <span>{new Date().getFullYear()}</span> Streetwise Score
        </span>
        <a className="t-toplink" href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
