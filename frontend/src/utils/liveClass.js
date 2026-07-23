export const isLiveClassUrl = (value = "") => /^https?:\/\/\S+$/i.test(String(value).trim());

export const getLiveClassConfig = (value = "") => {
  const normalized = String(value || "").trim();
  if (!isLiveClassUrl(normalized)) return { type: "join", provider: "none", href: "" };

  if (/youtube\.com|youtu\.be/i.test(normalized)) {
    return { type: "video", provider: "youtube", href: normalized };
  }
  if (/vimeo\.com/i.test(normalized)) {
    return { type: "video", provider: "vimeo", href: normalized };
  }
  if (/zoom\.us/i.test(normalized)) {
    return { type: "join", provider: "zoom", href: normalized };
  }
  if (/meet\.google\.com/i.test(normalized)) {
    return { type: "join", provider: "google-meet", href: normalized };
  }
  if (/teams\.microsoft\.com/i.test(normalized)) {
    return { type: "join", provider: "teams", href: normalized };
  }
  if (/whereby\.com/i.test(normalized)) {
    return { type: "join", provider: "whereby", href: normalized };
  }
  if (/jitsi\.org/i.test(normalized)) {
    return { type: "join", provider: "jitsi", href: normalized };
  }

  return { type: "join", provider: "custom", href: normalized };
};

export const getProviderLabel = (provider) => {
  const labels = {
    youtube: "YouTube",
    vimeo: "Vimeo",
    zoom: "Zoom",
    "google-meet": "Google Meet",
    teams: "Microsoft Teams",
    whereby: "Whereby",
    jitsi: "Jitsi",
    custom: "Meeting link",
    none: "Session",
  };
  return labels[provider] || "Session";
};

export const getVideoEmbedUrl = (href, provider) => {
  if (provider === "youtube") {
    const match = String(href).match(/(?:youtu\.be\/|v=)([\w-]+)/i);
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
  }
  if (provider === "vimeo") {
    const match = String(href).match(/vimeo\.com\/(\d+)/i);
    return match ? `https://player.vimeo.com/video/${match[1]}` : "";
  }
  return "";
};

export const getLiveClassActionLabel = (config, purpose = "join") => {
  if (!config?.href) return purpose === "session" ? "—" : "Join class";
  if (config.type === "video") {
    return purpose === "session" ? `Watch on ${getProviderLabel(config.provider)}` : "Watch class video";
  }
  if (config.provider === "google-meet") return purpose === "session" ? "Google Meet" : "Join on Google Meet";
  if (config.provider === "zoom") return purpose === "session" ? "Zoom" : "Join on Zoom";
  if (config.provider === "teams") return purpose === "session" ? "Microsoft Teams" : "Join on Teams";
  return purpose === "session" ? getProviderLabel(config.provider) : `Join on ${getProviderLabel(config.provider)}`;
};
