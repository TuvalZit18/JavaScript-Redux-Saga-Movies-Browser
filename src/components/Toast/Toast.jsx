import React, { useEffect } from "react";
import styles from "./Toast.module.css";

/**
 * Toast
 *
 * Non-blocking notification that auto-dismisses after DURATION_MS.
 * Used in MovieDetailPage to inform the user when they reach
 * the first or last movie in the current list.
 *
 * @param {string}   message   - Text to display inside the toast
 * @param {string}   type      - Visual variant: 'info' | 'warning'
 * @param {Function} onDismiss - Called when the toast finishes (auto or manual)
 */

// How long the toast stays visible before auto-dismissing
const DURATION_MS = 3000;

const Toast = ({ message, type = "info", onDismiss }) => {
  // Auto-dismiss after DURATION_MS — cleanup clears the timer
  // if the component unmounts before the timer fires
  useEffect(() => {
    const timer = setTimeout(onDismiss, DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`${styles.toast} ${styles[type]}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.icon}>{type === "warning" ? "⚠️" : "ℹ️"}</span>
      <span className={styles.message}>{message}</span>
    </div>
  );
};

export default Toast;
