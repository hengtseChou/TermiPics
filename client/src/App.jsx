import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

library.add(faGoogle);

function App() {
  return (
    <Router>
      <div className="min-h-screen flex items-center justify-center bg-black text-green-400 font-mono">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
