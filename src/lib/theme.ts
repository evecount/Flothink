import { useEffect, useState } from "react";

export type FlothinkTheme = "ember" | "slate" | "custom";

export type CustomSkin = {
  imageDataUrl: string;
  ember: string;
  emberSoft: string;
  ink: string;
  inkDeep: string;
};

const STORAGE_KEY = "flothink-theme";
const CUSTOM_KEY = "flothink-custom-skin";
const EVENT_NAME = "flothink-theme-change";

const CUSTOM_VARS = ["--ember", "--ember-soft", "--ink", "--ink-deep"] as const;

function readStoredTheme(): FlothinkTheme {
  if (typeof window === "undefined") return "ember";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "slate" || saved === "custom") return saved;
  return "ember";
}

function readCustomSkin(): CustomSkin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as CustomSkin) : null;
  } catch {
    return null;
  }
}

function applyThemeToDom(theme: FlothinkTheme, custom: CustomSkin | null) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  if (theme === "custom" && custom) {
    root.style.setProperty("--ember", custom.ember);
    root.style.setProperty("--ember-soft", custom.emberSoft);
    root.style.setProperty("--ink", custom.ink);
    root.style.setProperty("--ink-deep", custom.inkDeep);
  } else {
    for (const v of CUSTOM_VARS) root.style.removeProperty(v);
  }
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

export async function buildCustomSkinFromFile(file: File): Promise<CustomSkin> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Invalid image file."));
    el.src = dataUrl;
  });

  // Downscale for localStorage and sample dominant vibrant hue
  const maxSide = 1080;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");
  ctx.drawImage(img, 0, 0, w, h);

  const sample = ctx.getImageData(0, 0, w, h).data;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let weightSum = 0;
  const step = 4 * 16;
  for (let i = 0; i < sample.length; i += step) {
    const r = sample[i]!;
    const g = sample[i + 1]!;
    const b = sample[i + 2]!;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const weight = 1 + (max - min) / 32; // favor saturated tones for button accent
    rSum += r * weight;
    gSum += g * weight;
    bSum += b * weight;
    weightSum += weight;
  }

  const [hue, sat] = rgbToHsl(rSum / weightSum, gSum / weightSum, bSum / weightSum);
  const accentSat = Math.max(45, Math.min(88, sat || 55));

  return {
    imageDataUrl: canvas.toDataURL("image/jpeg", 0.82),
    ember: `hsl(${hue} ${accentSat}% 64%)`,
    emberSoft: `hsl(${hue} ${Math.round(accentSat * 0.65)}% 88%)`,
    ink: `hsl(${hue} ${Math.min(45, Math.round(accentSat * 0.4))}% 16%)`,
    inkDeep: `hsl(${hue} ${Math.min(35, Math.round(accentSat * 0.3))}% 12%)`,
  };
}

export function useFlothinkTheme() {
  const [theme, setThemeState] = useState<FlothinkTheme>("ember");
  const [customSkin, setCustomSkinState] = useState<CustomSkin | null>(null);

  useEffect(() => {
    const sync = () => {
      const t = readStoredTheme();
      const c = readCustomSkin();
      setThemeState(t);
      setCustomSkinState(c);
      applyThemeToDom(t, c);
    };
    sync();
    window.addEventListener(EVENT_NAME, sync);
    return () => window.removeEventListener(EVENT_NAME, sync);
  }, []);

  const setTheme = (next: FlothinkTheme) => {
    const c = readCustomSkin();
    window.localStorage.setItem(STORAGE_KEY, next);
    applyThemeToDom(next, c);
    setThemeState(next);
    setCustomSkinState(c);
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  const applyCustomSkin = (skin: CustomSkin) => {
    window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(skin));
    window.localStorage.setItem(STORAGE_KEY, "custom");
    applyThemeToDom("custom", skin);
    setCustomSkinState(skin);
    setThemeState("custom");
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  return { theme, customSkin, setTheme, applyCustomSkin };
}
