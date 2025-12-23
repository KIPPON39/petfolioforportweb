"use client"
import { useState } from "react";
import router, { Router } from "next/router";
import { useRouter } from "next/navigation";
import Image from "next/image";
export default function Register() {
  const [username, setUsername] = useState(""); // เพิ่ม username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("https://api.petfolio.wisitdev.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Register successful!" );
        localStorage.setItem("userId", data.userId); // เก็บ userId ไว้ frontend
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
         router.push("/");
      } else {
        alert(data.error || "Register failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

    const GotoLogin = () => {
    router.push('')
  }


  return (
    <>
    <div className="font-sans  bg-[#fffff]">
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        {/* Logo */}
        <div>
          <Image
            src="/Logo.png"
            alt="Logo"
            className="w-20 sm:w-56 md:w-72 h-auto mb-6"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            สมัครสมาชิก
          </h1>

          {/* Username */}
          <input
            className="text-black w-full px-4 py-3 mb-4 border border-gray-300 rounded-xl 
                   focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Email */}
          <input
            className=" text-black w-full px-4 py-3 mb-4 border border-gray-300 rounded-xl 
                   focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
          <input
            className="text-black w-full px-4 py-3 mb-4 border border-gray-300 rounded-xl 
                   focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Confirm Password */}
          <input
            className="text-black w-full px-4 py-3 mb-6 border border-gray-300 rounded-xl 
                   focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {/* Button */}
          <button
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white 
                   rounded-xl font-medium transition-colors shadow-lg"
           onClick={handleRegister}
          >
            สมัครสมาชิก
          </button>
          <p className="text-sm text-gray-500 mt-4 text-center">
                <span
         onClick={() => router.push("/login")} // หรือใช้ Link ของ react-router
        className="text-purple-600 hover:underline cursor-pointer font-medium text-center"
      >
       เข้าสู่ระบบ
      </span>
          </p>
        </div>
      </div>
      </div>
    </>

  );
}
