import React from "react";
import styles from "./Header.module.css";

// ─────────────────────────────────────────────
// Header — App title bar
// ─────────────────────────────────────────────
const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>✡</span>
          <span className={styles.logoText}>
            Zman <span className={styles.logoAccent}>Masach</span>
          </span>
        </div>
        <p className={styles.tagline}>Discover your next favorite film</p>
      </div>
    </header>
  );
};

export default Header;
