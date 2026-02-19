import React from "react";
import styles from "./Footer.module.css";

// ─────────────────────────────────────────────
// Footer — Developer info & credits
// Replace the placeholder values below with your own details
// ─────────────────────────────────────────────
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.logoIcon}>✡</span>
          <span className={styles.logoText}>
            Zman <span className={styles.logoAccent}>Masach</span>
          </span>
          <span className={styles.separator}>·</span>
          <span className={styles.credit}>
            Built by <strong>Tuval ZItelbach</strong>
          </span>
        </div>

        <div className={styles.center}>
          <span className={styles.powered}>
            Powered by{" "}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              TMDB
            </a>
          </span>
        </div>

        <div className={styles.right}>
          <a
            href="https://github.com/TuvalZit18"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            aria-label="GitHub profile"
          >
            GitHub
          </a>
          <span className={styles.separator}>·</span>
          <a
            href="https://www.linkedin.com/in/tuval-zitelbach/"
            className={styles.link}
            aria-label="Contact email"
          >
            LinkedIn
          </a>
          <span className={styles.separator}>·</span>
          <span className={styles.year}>© {currentYear}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
