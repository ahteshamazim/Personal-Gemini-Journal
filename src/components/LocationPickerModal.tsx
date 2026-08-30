import React, { useState } from "react";
import { MapPin, Navigation, X, Check, Globe, Sparkles } from "lucide-react";
import { LocationTag } from "../types";

interface LocationPickerModalProps {
  initialLocation?: LocationTag;
  onSave: (location?: LocationTag) => void;
  onClose: () => void;
}

const PRESET_PLACES = [
  { name: "Home Reflection Studio", lat: 37.7749, lng: -122.4194 },
  { name: "Zen Temple & Garden, Kyoto", lat: 35.0116, lng: 135.7681 },
  { name: "Alpine Sanctuary, Zermatt", lat: 45.9765, lng: 7.7491 },
  { name: "Quiet Library & Archive, Oxford", lat: 51.752, lng: -1.2577 },
  { name: "Ocean Overlook, Big Sur", lat: 36.2704, lng: -121.8081 },
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  initialLocation,
  onSave,
  onClose,
}) => {
  const [placeName, setPlaceName] = useState(initialLocation?.placeName || "");
  const [latitude, setLatitude] = useState<string>(
    initialLocation?.latitude !== undefined ? String(initialLocation.latitude) : ""
  );
  const [longitude, setLongitude] = useState<string>(
    initialLocation?.longitude !== undefined ? String(initialLocation.longitude) : ""
  );
  const [detecting, setDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setDetecting(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(5));
        setLongitude(position.coords.longitude.toFixed(5));
        if (!placeName.trim()) {
          setPlaceName(
            `Location (${position.coords.latitude.toFixed(2)}°, ${position.coords.longitude.toFixed(2)}°)`
          );
        }
        setDetecting(false);
      },
      (err) => {
        console.warn("Geolocation detection failed:", err);
        setDetecting(false);
        setErrorMsg("Could not detect coordinates. You can select a preset or type a location manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectPreset = (preset: typeof PRESET_PLACES[0]) => {
    setPlaceName(preset.name);
    setLatitude(preset.lat.toFixed(5));
    setLongitude(preset.lng.toFixed(5));
    setErrorMsg(null);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim()) {
      onSave(undefined);
      onClose();
      return;
    }

    const latNum = latitude ? parseFloat(latitude) : undefined;
    const lngNum = longitude ? parseFloat(longitude) : undefined;

    onSave({
      placeName: placeName.trim(),
      latitude: !isNaN(latNum as number) ? latNum : undefined,
      longitude: !isNaN(lngNum as number) ? lngNum : undefined,
    });
    onClose();
  };

  const handleRemove = () => {
    onSave(undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Location-Aware Tagging
              </h3>
              <p className="text-[11px] text-white/40">
                Attach geographic context to your journal entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* GPS Auto-Detect Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detecting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-all shadow-sm"
          >
            <Navigation className={`h-3.5 w-3.5 ${detecting ? "animate-spin" : ""}`} />
            <span>{detecting ? "Detecting GPS Coordinates..." : "Detect Current Location"}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-[11px] text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Preset Locations */}
        <div className="mt-4">
          <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-2">
            Inspirational Reflection Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PLACES.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="rounded-lg border border-white/10 bg-[#111111] px-2.5 py-1 text-[10px] text-white/70 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Inputs Form */}
        <form onSubmit={handleApply} className="mt-5 space-y-3.5">
          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1">
              Place / Sanctuary Name
            </label>
            <input
              type="text"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="e.g., Kyoto Zen Garden or Home Office"
              className="w-full rounded-xl border border-white/10 bg-[#111111] px-3.5 py-2 text-xs text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1">
                Latitude (optional)
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="37.7749"
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-2 text-xs text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1">
                Longitude (optional)
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-122.4194"
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-2 text-xs text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            {initialLocation ? (
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-rose-400 hover:underline font-medium"
              >
                Remove Tag
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-indigo-50 shadow-lg"
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Save Location</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
