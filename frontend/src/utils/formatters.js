import { formatDistanceToNow, format } from "date-fns";

export const formatTime = (date) => {
  if (!date) return "";
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d ago`;

  return format(new Date(date), "MMM d");
};

export const formatTimeChat = (date) => {
  if (!date) return "";
  const now = new Date();
  const messageDate = new Date(date);
  const diff = now - messageDate;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return format(messageDate, "HH:mm");
  
  const days = Math.floor(minutes / 1440);
  if (days === 1) return "yesterday";
  if (days < 7) return format(messageDate, "EEE");
  
  return format(messageDate, "MMM d");
};

export const formatMediaSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const truncateText = (text, length = 50) => {
  if (!text) return "";
  return text.length > length ? text.substring(0, length) + "..." : text;
};

export const capitalizeFirst = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
