import React from "react";
import styles from "./Footer.module.css";

/**
 * Footer
 *
 * App footer — purely presentational, no logic or state.
 * Three-column layout: branding left, TMDB credit center, links right.
 * Fixed height defined by --footer-height CSS variable in index.css.
 */
const Footer = () => {
  // Computed at render time so the copyright year never goes stale
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Left — app logo + developer credit */}
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

        {/* Center — TMDB data attribution (required by TMDB API terms) */}
        <div className={styles.center}>
          {/* TMDB attribution — required by TMDB API terms of service */}
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
        {/* Right — GitHub, LinkedIn links + copyright year */}
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
