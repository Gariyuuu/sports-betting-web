"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sbw-theme";

export default function ThemeSlider() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      className="theme-slider"
      role="switch"
      aria-checked={theme === "light"}
      aria-label="Toggle light/dark theme"
      onClick={toggle}
    >
      <span className="theme-slider-icon moon">🌙</span>
      <span className="theme-slider-icon sun">☀️</span>
      <span className={`theme-slider-knob ${theme}`} />
    </button>
  );
}
