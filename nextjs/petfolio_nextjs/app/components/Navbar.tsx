"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
export default function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);
  const router = useRouter();

useEffect(() => {
  const fetchReminderCount = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!userId || !token) return;

    try {
      const res = await fetch(`https://petfolio.wisitdev.com/api/reminders/user/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch reminders");
      const data = await res.json();

      const incomplete = (data as { completed: boolean }[]).filter(r => !r.completed);
      setReminderCount(incomplete.length);
    } catch (err) {
      console.error(err);
    }
  };

  // เรียกครั้งแรก
  fetchReminderCount();

  // ตั้ง interval ให้ fetch ทุก 1 วินาที
  const interval = setInterval(fetchReminderCount, 1000);

  // ล้าง interval ตอน component unmount
  return () => clearInterval(interval);
}, []);
  useEffect(() => {
    const fetchReminderCount = async () => {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      if (!userId || !token) return;

      try {
        const res = await fetch(`https://petfolio.wisitdev.com/api/reminders/user/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch reminders");
        const data = await res.json();

        // cast เฉพาะ object ที่เราต้องการใช้ completed
        const incomplete = (data as { completed: boolean }[]).filter(
          (r) => !r.completed
        );
        setReminderCount(incomplete.length);
      } catch (err) {
        console.error(err);
      }
    };

    fetchReminderCount();
  }, []);

  const toggleProfileMenu = () => setIsProfileOpen(!isProfileOpen);

  // ฟังก์ชัน logout
  const logout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    router.push("/"); // เปลี่ยน path เป็นหน้า login ของคุณ
  };

  return (
    <nav className=" font-sans bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-purple-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* โลโก้ */}
         <div>
        <Image
          src="/navlogo.png"
          alt="Logo"
          className="w-32 h-auto"  // กำหนดความกว้างและรักษาสัดส่วน
        />
      </div>

          {/* เมนู */}
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              หน้าหลัก
            </Link>
            <Link href="/pet" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              สัตว์เลี้ยง
            </Link>
            <Link href="/health" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              สุขภาพ
            </Link>
            <Link href="/calendar" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              ปฏิทิน
            </Link>
            <Link href="/community" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              คอมมูนิตี้
            </Link>
            
            {/* แจ้งเตือน */}
            <Link
              href="/reminders"
              className="relative text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              แจ้งเตือน
              {reminderCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {reminderCount}
                </span>
              )}
            </Link>

            {/* โปรไฟล์ */}
            <div className="relative">
              <button
                onClick={toggleProfileMenu}
                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  U
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                  <Link href="/admin" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                    Admin
                  </Link>
                  
                  <button 
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
