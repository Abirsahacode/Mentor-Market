export const formatDisplayName = (name = "") => {
  const value = String(name).trim();
  if (!value) return "Mentor Market member";

  return value.split(/\s+/).map((part) => (
    part === part.toLocaleLowerCase()
      ? `${part.charAt(0).toLocaleUpperCase()}${part.slice(1)}`
      : part
  )).join(" ");
};

export const firstDisplayName = (name = "") => formatDisplayName(name).split(" ")[0];
