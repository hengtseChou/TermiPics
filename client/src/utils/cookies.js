import Cookies from "js-cookie";

const cookieConfig = {
  path: "/",
  secure: window.location.protocol === "https:",
  sameSite: "Strict",
  httpOnly: false,
};

const setCookie = (name, value) => {
  Cookies.set(name, value, cookieConfig);
};

const getCookie = (name) => {
  return Cookies.get(name);
};

const removeCookie = (name) => {
  Cookies.remove(name, cookieConfig);
};

export { setCookie, getCookie, removeCookie };
