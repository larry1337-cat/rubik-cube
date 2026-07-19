import { useEffect, useState } from "react";

export type DeviceType = "touch" | "desktop";

function detect(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const narrowScreen = window.matchMedia("(max-width: 820px)").matches;
  return coarsePointer || narrowScreen ? "touch" : "desktop";
}

/**
 * Auto device detection: combines pointer precision (mouse vs finger) with
 * viewport width, and re-evaluates on resize/orientation change — so
 * rotating a tablet or resizing a browser window updates the layout live
 * instead of only checking once on load.
 */
export function useDeviceType(): DeviceType {
  const [device, setDevice] = useState<DeviceType>(detect);

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const widthQuery = window.matchMedia("(max-width: 820px)");
    const update = () => setDevice(detect());

    pointerQuery.addEventListener("change", update);
    widthQuery.addEventListener("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      pointerQuery.removeEventListener("change", update);
      widthQuery.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return device;
}
