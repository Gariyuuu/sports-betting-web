"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sbw-theme";
const THEMES = [
  { key: "dark", label: "Stadium" },
  { key: "light", label: "Paper" },
  { key: "vegas", label: "Vegas" },
  { key: "field", label: "Field" },
] as const;

type ThemeKey = (typeof THEMES)[number]["key"];

export default function ThemeWheel() {
  const [theme, setTheme] = useState<ThemeKey>("dark");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as ThemeKey | null;
    if (current && THEMES.some((t) => t.key === current)) setTheme(current);
  }, []);

  function select(next: ThemeKey) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  return (
    <div className="theme-wheel" role="radiogroup" aria-label="Theme">
      {THEMES.map((t) => (
        <button
          key={t.key}
          type="button"
          role="radio"
          aria-checked={theme === t.key}
          title={t.label}
          className={`swatch ${t.key} ${theme === t.key ? "active" : ""}`}
          onClick={() => select(t.key)}
        />
      ))}
    </div>
  );
}
