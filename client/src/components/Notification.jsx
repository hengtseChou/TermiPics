import { toast } from "react-toastify";

const showToast = data => {
  const { title, msg, type } = data;

  const body = (
    <div className="ms-1 text-green-300">
      <strong className="block text-md">{title}</strong>
      <p className="text-sm">{msg}</p>
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
      toast.success(body, options);
      break;
    case "error":
      toast.error(body, options);
      break;
    case "info":
      toast.info(body, options);
      break;
    case "warning":
      toast.warning(body, options);
      break;
    default:
      toast(body, options);
  }
};

export default showToast;
