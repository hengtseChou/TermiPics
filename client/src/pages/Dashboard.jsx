import React, { useContext } from "react";

import { AuthContext } from "../contexts/AuthContext";

function Dashboard() {
  const { userUid } = useContext(AuthContext);

  return (
    <div className="text-green-500 font-mono">
      <h1 className="text-3xl text-center">Dashboard</h1>
      <p className="text-center">{userUid}</p>
    </div>
  );
}

export default Dashboard;
