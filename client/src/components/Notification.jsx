import { toast } from "react-toastify";

const showToast = (data) => {
  const { title, text, type } = data;

  const message = (
    <div className="ms-1 text-green-300">
      <strong className="block text-md">{title}</strong>
      <p className="text-sm">{text}</p>
    </div>
  );

  const options = {
    theme: "dark",
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: true,
  };

  switch (type) {
    case "success":
      toast.success(message, options);
      break;
    case "error":
      toast.error(message, options);
      break;
    case "info":
      toast.info(message, options);
      break;
    case "warning":
      toast.warning(message, options);
      break;
    default:
      toast(message, options);
  }
};

export default showToast; // Ensure this is the default export
