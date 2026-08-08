import toast from "react-hot-toast";

const options = {
  duration: 3500,
  style: {
    borderRadius: "8px",
    fontWeight: 500,
    color: "#FFFFFF",
    background: "#2563EB",
  },
};

export const notifySuccess = (message) =>
  toast.success(message, {
    ...options,
    style: { ...options.style, background: "#16A34A" },
  });

export const notifyError = (message) =>
  toast.error(message, {
    ...options,
    style: { ...options.style, background: "#DC2626" },
  });

export const notifyInfo = (message) =>
  toast(message, { ...options, icon: "i" });
