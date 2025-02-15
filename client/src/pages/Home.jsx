import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-400 font-mono">
      <h1 className="text-5xl font-bold mb-4">[ Gary&apos;s Gallery_ ]</h1>
      <p className="text-lg text-green-300 mb-6">_Upload. Share. Organize_</p>

      <div className="flex space-x-4">
        <Link
          to="/auth/signup"
          className="px-6 py-2 bg-green-500 text-black rounded-lg hover:bg-green-600 transition"
        >
          [ Sign_Up ]
        </Link>
        <Link
          to="/auth/login"
          className="px-6 py-2 bg-gray-900 text-green-300 rounded-lg hover:bg-gray-800 transition"
        >
          [ Login ]
        </Link>
      </div>

      <div className="mt-10 w-full max-w-2xl p-6 bg-gray-900 rounded-lg shadow-lg border border-green-400 text-center">
        <h2 className="text-xl font-semibold">_Your Image Repository_</h2>
        <p className="text-green-300 mt-2">
          We&apos;re just like imgur.com without the annoying social features.
        </p>
      </div>

      <p className="mt-6 text-xs text-green-500">[ System_Functional ]</p>
    </div>
  );
}

export default Home;
