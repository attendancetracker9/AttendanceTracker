export const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
};

export const formatRelative = (iso: string) => {
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diff = Math.max(0, now - target);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

export const formatPhone = (phone: string) => {
  if (!phone.startsWith("+")) return `+${phone}`;
  return phone;
};

export const isE164Phone = (phone: string) => {
  if (!phone || typeof phone !== "string") return false;
  // Remove all non-digit characters (spaces, dashes, plus signs, etc.)
  const digitsOnly = phone.replace(/\D/g, "");
  // Check if it's exactly 10 digits
  return /^\d{10}$/.test(digitsOnly);
};

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidCGPA = (cgpa: string) => {
  const num = parseFloat(cgpa);
  return !isNaN(num) && num >= 0 && num <= 10;
};

export const isValidAttendancePercentage = (percentage: string) => {
  const num = parseFloat(percentage);
  return !isNaN(num) && num >= 0 && num <= 100;
};

export const classSectionLabel = (className: string, section: string) => `Class ${className} • Section ${section}`;

