"use client"
import { useState } from "react";
import Navbar from "../components/Navbar"
import { useRouter } from "next/navigation";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
   const router = useRouter();
//เข้าสู่ระบบ
  const handleLogin = async () => {
    const res = await fetch("http://localhost:3002/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.token && data.userId) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId); // ✅ ใช้ userId
      alert("Login success");
      router.push("/dashboard");
    } else {
      alert(data.error || "Login failed");
    }
  };

  return (
    <>
    <div className="font-sans  bg-[#fffff]">
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
 {/* Logo */}
        <div>
          <img
            src="/Logo.png"
            alt="Logo"
            className="w-20 sm:w-56 md:w-72 h-auto mb-6"
          />
        </div>


        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            เข้าสู่ระบบ
          </h1>

          {/* Email */}
          <input
            className="text-black w-full px-4 py-3 mb-4 border border-gray-300 rounded-xl 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
          <input
            className="text-black w-full px-4 py-3 mb-6 border border-gray-300 rounded-xl 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Button */}
          <button
            onClick={handleLogin}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white 
                     rounded-xl font-medium transition-colors shadow-lg"
          >
            เข้าสู่ระบบ
          </button>
          {/* Register Link */}

      <p className="text-sm text-gray-500 mt-4 text-center">
      <span
         onClick={() => router.push("/register")} // หรือใช้ Link ของ react-router
        className="text-purple-600 hover:underline cursor-pointer font-medium text-center"
      >
       ลงทะเบียน
      </span>
    </p>
        </div>
      </div>
</div>
    </>
  );
}
