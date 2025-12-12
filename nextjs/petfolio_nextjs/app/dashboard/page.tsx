"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {jwtDecode} from "jwt-decode";
import { addPetService } from "../services/pet_page_service";
import { useRouter } from "next/navigation";
import { FaRegCalendarAlt, FaTasks, FaPlus, FaHeartbeat } from "react-icons/fa";
import { MdGroups } from "react-icons/md";

interface JWTData {
  id: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

type PetType = "dog" | "cat" | "bird" | "fish" | "rabbit" | "hamster" | "unknown";

interface Pet {
  _id: string;
  name: string;
  type: PetType;
  emoji?: string;
}

interface ReminderType {
  _id: string;
  petId: Pet | null;
  title: string;
  date: string;
  time: string;
  details: string;
  completed?: boolean;
}

interface RawReminder {
  _id: string;
  petId?: { _id: string } | null;
  title?: string;
  date?: string;
  time?: string;
  details?: string;
  completed?: boolean;
}

export default function First_page() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUsername] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petCount, setPetCount] = useState<{ [key in PetType]?: number }>({});
  const [reminders, setReminders] = useState<ReminderType[]>([]);
  const [latestReminders, setLatestReminders] = useState<ReminderType[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const now = new Date();

  const [form, setForm] = useState({
    name: "",
    type: "" as string,
    breed: "",
    birthdate: "",
    weight: "",
    gender: "",
    personality: "",
    medicalConditions: "",
    privacy: "private",
  });

  // --- Routes ---
  const GotoCommunityPage = () => router.push("community");
  const GotoHealthPage = () => router.push("health");

  // --- Handle Form ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleAddPet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const userIdLocal = localStorage.getItem("userId");
    if (!token || !userIdLocal) return alert("กรุณา login ก่อน");

    try {
      const savedPet = await addPetService(form, token, userIdLocal);
      if (String(savedPet.pet.owner?._id) === String(userIdLocal)) {
        setPets(prev => [...prev, savedPet.pet]);
      }
      setShowModal(false);
      setForm({
        name: "",
        type: "",
        breed: "",
        birthdate: "",
        weight: "",
        gender: "",
        personality: "",
        medicalConditions: "",
        privacy: "private",
      });
      fetchPetCount();
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถเพิ่มสัตว์เลี้ยงได้");
    }
  };

  // --- Fetch Data ---
  const fetchPetCount = async () => {
    const userIdLocal = localStorage.getItem("userId");
    if (!userIdLocal) return;
    try {
      const res = await fetch(`http://127.0.0.1:3002/api/pets/petcount/${userIdLocal}`);
      if (!res.ok) throw new Error("Fail to fetch pet count");
      const result = await res.json();
      const formatted = result.reduce((acc: any, item: any) => {
        acc[item.type] = item.count;
        return acc;
      }, {});
      setPetCount(formatted);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchReminders = async () => {
    setIsLoading(true);
    const userIdLocal = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!userIdLocal) return;
    try {
      const res = await fetch(`http://localhost:3002/api/reminders/user/${userIdLocal}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch reminders");
      const data: RawReminder[] = await res.json();

      const formatted: ReminderType[] = data.map(r => ({
        _id: r._id,
        petId: null,
        title: r.title || "กิจกรรม",
        date: r.date || "",
        time: r.time || "",
        details: r.details || "",
        completed: r.completed,
      }));

      setReminders(formatted);

      // งานยังไม่เสร็จ
      const notDone = formatted.filter(r => !r.completed);
      setPendingCount(notDone.length);

      // 3 ตัวล่าสุด
      const latest = formatted
        .sort(
          (a, b) =>
            new Date(b.date + " " + b.time).getTime() -
            new Date(a.date + " " + a.time).getTime()
        )
        .slice(0, 3);
      setLatestReminders(latest);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const tokenRaw = localStorage.getItem("token");
    const userIdLocal = localStorage.getItem("userId");
    setUserId(userIdLocal);

    if (!tokenRaw) return;
    const token = tokenRaw.startsWith("Bearer ") ? tokenRaw.split(" ")[1] : tokenRaw;
    try {
      const decoded = jwtDecode<JWTData>(token);
      if (decoded?.email) setUserEmail(decoded.email);
      if (decoded?.username) setUsername(decoded.username);
    } catch (err) {
      console.error("Invalid token", err);
    }

    fetchPetCount();
    fetchReminders();
  }, []);

  const countThisWeek = reminders.filter(r => {
    const datetime = new Date(`${r.date}T${r.time}`);
    const day = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - day);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return datetime >= weekStart && datetime <= weekEnd;
  }).length;

  // --- Return JSX ---
  return (
    <div className="font-sans bg-[#fffff]">
      <Navbar />
      <div className="text-center p-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 pt-10">สวัสดี {userName}</h1>
        <p className="text-xl text-gray-600">วันนี้สัตว์เลี้ยงของคุณเป็นอย่างไรบ้าง</p>
      </div>

      {/* Pet Count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
          { type: "cat", label: "แมว", emoji: "🐱" },
          { type: "dog", label: "สุนัข", emoji: "🐶" },
          { type: "bird", label: "นก", emoji: "🐦" },
          { type: "fish", label: "ปลา", emoji: "🐠" },
          { type: "rabbit", label: "กระต่าย", emoji: "🐰" },
          { type: "hamster", label: "แฮมสเตอร์", emoji: "🐹" },
        ].map((pet, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 shadow-lg text-center hover:shadow-xl transition"
          >
            <div className="text-3xl mb-2">{pet.emoji}</div>
            <div className="text-xl font-bold text-black">{petCount[pet.type as PetType] || 0}</div>
            <div className="text-gray-600 text-sm">{pet.label}</div>
          </div>
        ))}
        </div>

        {/* Latest Reminders & Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8 mt-16">
          <div className="bg-white rounded-2xl p-6 shadow-lg col-span-2 row-span-2">
            <h2 className="text-xl font-bold mb-4 text-black">การแจ้งเตือนล่าสุด</h2>
            {latestReminders.length === 0 ? (
              <p className="text-gray-400 font-semibold">ไม่มีแจ้งเตือน</p>
            ) : (
              <div className="space-y-4">
                {latestReminders.map((reminder, index) => (
                  <div
                    key={reminder._id}
                    className={`flex items-start p-4 rounded-xl shadow-md transition ${
                      index % 2 === 0 ? "bg-gradient-to-r from-cyan-50 to-cyan-100" : "bg-gradient-to-r from-green-50 to-green-100"
                    }`}
                  >
                    <div className="text-2xl mr-4">{index % 2 === 0 ? "💡" : "⚠️"}</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{reminder.title}</p>
                      <p className="text-sm text-gray-500">{reminder.date} {reminder.time}</p>
                      <p className="text-gray-700">{reminder.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 text-center flex flex-col items-center justify-center transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
            <FaRegCalendarAlt className="text-blue-500 text-3xl mb-2" />
            <div className="text-lg font-bold text-blue-500">สัปดาห์นี้</div>
            <div className="text-md text-blue-400">{countThisWeek} รายการ</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 text-center flex flex-col items-center justify-center transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
            <FaTasks className="text-yellow-500 text-3xl mb-2" />
            <div className="text-lg font-bold text-yellow-500">งานที่ยังไม่เสร็จ</div>
            <div className="text-md text-yellow-400">{pendingCount} รายการ</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-6 mb-8 mt-16">
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-500 rounded-2xl p-6 shadow-xl text-center flex flex-col items-center transform transition-all duration-300 hover:-translate-y-2"
          >
            <FaPlus className="text-white text-4xl mb-3" />
            <h3 className="text-lg font-bold mb-1 text-white">เพิ่มสัตว์เลี้ยงใหม่</h3>
            <p className="text-sm text-white/90">เพิ่มสมาชิกใหม่ในครอบครัว</p>
          </button>

          <button
            onClick={GotoHealthPage}
            className="bg-green-500 rounded-2xl p-6 shadow-xl text-center flex flex-col items-center transform transition-all duration-300 hover:-translate-y-2"
          >
            <FaHeartbeat className="text-white text-4xl mb-3" />
            <h3 className="text-lg font-bold mb-1 text-white">บันทึกสุขภาพ</h3>
            <p className="text-sm text-white/90">อัปเดตข้อมูลการดูแล</p>
          </button>

          <button
            onClick={GotoCommunityPage}
            className="bg-cyan-500 rounded-2xl p-6 shadow-xl text-center flex flex-col items-center transform transition-all duration-300 hover:-translate-y-2"
          >
            <MdGroups className="text-white text-4xl mb-3" />
            <h3 className="text-lg font-bold mb-1 text-white">แชร์ในคอมมูนิตี้</h3>
            <p className="text-sm text-white/90">อวดสัตว์เลี้ยงน่ารักของคุณ</p>
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">เพิ่มสัตว์เลี้ยงใหม่</h3>
            <form className="space-y-6" onSubmit={handleAddPet}>
              {/* ...Form fields same as original code... */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                >
                  เพิ่มสัตว์เลี้ยงใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
