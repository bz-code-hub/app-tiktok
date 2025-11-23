import { useEffect } from "react";
import { pixelsConfig } from "@/config/livestream-config";

/**
 * PixelInjector Component
 *
 * Automatically injects tracking pixels (Facebook, TikTok, Google Analytics)
 * from the pixelsConfig into the document head
 */
export const PixelInjector = () => {
  useEffect(() => {
    const { facebookPixel, tiktokPixel, googleAnalyticsPixel } = pixelsConfig;

    // Inject Facebook Pixel
    if (facebookPixel.trim()) {
      const facebookContainer = document.createElement("div");
      facebookContainer.innerHTML = facebookPixel;
      document.head.appendChild(facebookContainer);

      // Execute any scripts within the pixel
      const scripts = facebookContainer.querySelectorAll("script");
      scripts.forEach((script) => {
        const newScript = document.createElement("script");
        newScript.text = script.text;
        newScript.src = script.src;
        if (script.async) newScript.async = true;
        if (script.defer) newScript.defer = true;
        document.head.appendChild(newScript);
      });
    }

    // Inject TikTok Pixel
    if (tiktokPixel.trim()) {
      const tiktokContainer = document.createElement("div");
      tiktokContainer.innerHTML = tiktokPixel;
      document.head.appendChild(tiktokContainer);

      // Execute any scripts within the pixel
      const scripts = tiktokContainer.querySelectorAll("script");
      scripts.forEach((script) => {
        const newScript = document.createElement("script");
        newScript.text = script.text;
        newScript.src = script.src;
        if (script.async) newScript.async = true;
        if (script.defer) newScript.defer = true;
        document.head.appendChild(newScript);
      });
    }

    // Inject Google Analytics Pixel
    if (googleAnalyticsPixel.trim()) {
      const gaContainer = document.createElement("div");
      gaContainer.innerHTML = googleAnalyticsPixel;
      document.head.appendChild(gaContainer);

      // Execute any scripts within the pixel
      const scripts = gaContainer.querySelectorAll("script");
      scripts.forEach((script) => {
        const newScript = document.createElement("script");
        newScript.text = script.text;
        newScript.src = script.src;
        if (script.async) newScript.async = true;
        if (script.defer) newScript.defer = true;
        document.head.appendChild(newScript);
      });
    }
  }, []);

  return null; // This component doesn't render anything visually
};
