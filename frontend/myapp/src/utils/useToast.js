import { notifyError, notifyInfo, notifySuccess } from "./toast.js";

export const useToast = () => ({
  showToast: (message, type = "success") => {
    if (type === "error") return notifyError(message);
    if (type === "info") return notifyInfo(message);
    return notifySuccess(message);
  },
});
