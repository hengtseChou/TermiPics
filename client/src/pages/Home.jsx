import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="flex justify-center items-center bg-black min-h-screen">
      <div className="flex flex-col justify-center items-center font-mono text-green-500">
        <h1 className="mb-4 font-bold text-5xl">[ Gary&apos;s Gallery_ ]</h1>
        <p className="mb-6 text-green-300 text-lg">_Upload. Share. Organize_</p>
        <div className="flex space-x-4">
          <Link
            to="/signup"
            className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-lg text-black transition"
          >
            [ Sign_Up ]
          </Link>
          <Link
            to="/login"
            className="bg-gray-900 hover:bg-gray-800 px-6 py-2 rounded-lg text-green-300 transition"
          >
            [ Login ]
          </Link>
        </div>
        <div className="bg-gray-900 shadow-lg mt-10 p-6 border border-green-500 rounded-lg w-full max-w-2xl text-center">
          <h2 className="font-semibold text-xl">_Your Image Repository_</h2>
          <p className="mt-2 text-green-300">
            We&apos;re just like imgur.com without the annoying social features.
          </p>
        </div>
        <p className="mt-6 text-green-500 text-xs">[ All_Systems_Operational ]</p>
      </div>
    </div>
  );
}

export default Home;
