import React from "react";
import styles from "./Header.module.css";

/**
 * Header
 *
 * App title bar — purely presentational, no logic or state.
 * Displays the Zman Masach logo and tagline.
 * Fixed height defined by --header-height CSS variable in index.css.
 */
const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo — icon + "Zman" in primary color + "Masach" in accent color */}
        <div className={styles.logo}>
          {/* ✡ — Star of David, used as the brand icon reflecting the Hebrew name */}
          <span className={styles.logoIcon}>✡</span>
          <span className={styles.logoText}>
            Zman <span className={styles.logoAccent}>Masach</span>
          </span>
        </div>
        {/* Tagline — shown on the right side of the header */}
        <p className={styles.tagline}>Discover your next favorite film</p>
      </div>
    </header>
  );
};

export default Header;
