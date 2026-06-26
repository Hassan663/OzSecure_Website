'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * Light/dark theme toggle. The actual class is set pre-paint by the inline
 * script in layout.js (no flash); this button reads the current state on mount,
 * flips the `dark` class on <html>, and persists the choice to localStorage.
 * Accessible: real <button>, dynamic aria-label, keyboard-focusable.
 */
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch (e) {
      /* ignore */
    }
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-hairline text-muted transition-colors hover:border-ink/25 hover:text-ink"
    >
      {/* Fixed-size box; icon swaps in after mount to avoid hydration mismatch */}
      {!mounted ? (
        <span className="h-[18px] w-[18px]" />
      ) : isDark ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}
    </button>
  );
}
