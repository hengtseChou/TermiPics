import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";

function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });

  useEffect(() => {
    document.title = "Sign Up - Gary's Gallery";
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const response = await fetch("http://127.0.0.1:8000/signup/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
  
    const data = await response.json();
    if (response.ok) {
      console.log("Signup successful:", data);
    } else {
      console.error("Signup failed:", data.detail);
    }
  };  

  const handleGoogleSuccess = async (credentialResponse) => {
    const response = await fetch("http://127.0.0.1:8000/google-login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: credentialResponse.credential }),
    });
  
    const data = await response.json();
    if (response.ok) {
      console.log("Google Login Successful:", data);
    } else {
      console.error("Google Login Failed:", data.detail);
    }
  };

  const handleGoogleFailure = () => {
    console.error("Google Login Failed");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-400 font-mono">
      <h1 className="text-4xl font-bold mb-6">[ Sign_Up_ ]</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md bg-gray-900 p-6 rounded-lg shadow-lg border border-green-400">
        <label className="block mb-4">
          <span className="text-green-300">Email:</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full mt-1 p-2 bg-gray-800 text-green-300 border border-green-500 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </label>

        <label className="block mb-4">
          <span className="text-green-300">Username:</span>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full mt-1 p-2 bg-gray-800 text-green-300 border border-green-500 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </label>

        <label className="block mb-6">
          <span className="text-green-300">Password:</span>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full mt-1 p-2 bg-gray-800 text-green-300 border border-green-500 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </label>

        <button type="submit" className="w-full py-2 bg-green-800 text-black rounded-lg hover:bg-green-700 transition">
          [ Create_Account ]
        </button>
      </form>

      <div className="mt-6 w-full max-w-md">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-1/3 h-px bg-green-400"></div>
          <p className="text-green-300 text-sm">or</p>
          <div className="w-1/3 h-px bg-green-400"></div>
        </div>

        <div className="mt-4 w-full flex items-center justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
          />
        </div>
      </div>

      <p className="mt-6 text-xs text-green-500">[ System_Ready ]</p>
    </div>
  );
}

export default Signup;
