"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
 import { AiOutlineAlert, AiOutlineClockCircle, AiOutlineCalendar, AiOutlineCheckCircle } from 'react-icons/ai';

// --- Types ---
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
}

// --- Raw Reminder from API ---
interface RawReminder {
  _id: string;
  petId?: { _id: string } | null;
  title?: string;
  date?: string;
  time?: string;
  details?: string;
  completed?: boolean;
  petName?: string;
  petType?: string;
}

// --- Component ---
export default function Reminder() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [reminders, setReminders] = useState<ReminderType[]>([]);
  const [completedReminders, setCompletedReminders] = useState<ReminderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [notePlaceholder, setNotePlaceholder] = useState("รายละเอียดเพิ่มเติม...");
  const [userId, setUserId] = useState<string | null>(null);

  // --- Utility: Get Emoji by Pet Type ---
  const getPetEmoji = (type?: string) => {
    switch (type) {
      case "dog": return "🐶";
      case "cat": return "🐱";
      case "bird": return "🐦";
      case "rabbit": return "🐰";
      case "hamster": return "🐹";
      default: return "🐾";
    }
  };

  // --- Load userId from localStorage ---
  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  // --- Fetch Pets and Reminders ---
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      try {
        // Fetch Pets
        const petsRes = await fetch(`https://api.petfolio.wisitdev.com/api/pets/user/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const petsData: Pet[] = petsRes.ok ? await petsRes.json() : [];
        const formattedPets = petsData.map(p => ({ ...p, emoji: p.emoji || getPetEmoji(p.type) }));
        setPets(formattedPets);

        // Fetch Reminders
        const remRes = await fetch(`https://api.petfolio.wisitdev.com/api/reminders/user/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!remRes.ok) throw new Error("Failed to fetch reminders");
        const remData: RawReminder[] = await remRes.json();

        const incomplete: ReminderType[] = [];
        const completed: ReminderType[] = [];

        remData.forEach((r) => {
          let pet: Pet | undefined = r.petId
            ? formattedPets.find(p => p._id === r.petId?._id)
            : undefined;

          if (!pet) {
            pet = {
              _id: "",
              name: r.petName || "ไม่ทราบ",
              type: "unknown",
              emoji: r.petType ? getPetEmoji(r.petType) : "🐾"
            };
          }

          const reminderObj: ReminderType = {
            _id: r._id,
            petId: pet,
            title: r.title || "กิจกรรม",
            date: r.date || "",
            time: r.time || "",
            details: r.details || ""
          };

          if (r.completed) completed.push(reminderObj);
          else incomplete.push(reminderObj);
        });

        setReminders(incomplete);
        setCompletedReminders(completed);

      } catch (error: unknown) {
        console.error(error);
        setPets([]);
        setReminders([]);
        setCompletedReminders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // --- Handle Type Change for Placeholder ---
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    const placeholders: Record<string, string> = {
      "อาหาร": "เช่น อาหารเช้า/กลางวัน/เย็น",
      "ยา": "เช่น ให้ยาเวลา 08:00 น.",
      "ออกกำลังกาย": "เช่น วิ่ง 30 นาที",
      "อาบน้ำ/ตัดขน": "เช่น อาบน้ำวันเสาร์",
      "พบสัตวแพทย์": "เช่น นัดตรวจสุขภาพ 10:00 น.",
      "วัคซีน": "เช่น วัคซีนตัวที่ 2",
      "ถ่ายพยาธิ": "เช่น ถ่ายพยาธิเดือนละครั้ง",
      "ข้อมูลสัตว์เลี้ยง": "รายละเอียดเพิ่มเติม..."
    };
    setNotePlaceholder(placeholders[value] || "รายละเอียดเพิ่มเติม...");
  };

  // --- Handle Form Submit ---
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return alert("ไม่พบผู้ใช้");
    const isConfirmed = window.confirm("คุณแน่ใจว่าจะบันทึกการแจ้งเตือนนี้ใช่หรือไม่?");
  if (!isConfirmed) return; // ถ้า user กดยกเลิก ก็ไม่ทำอะไรต่อ
    const form = e.currentTarget;
    const datetimeInput = (form.elements.namedItem("datetime") as HTMLInputElement).value;
    const petId = (form.elements.namedItem("petId") as HTMLSelectElement).value;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const details = (form.elements.namedItem("note") as HTMLTextAreaElement).value || "";

    if (!petId) return alert("กรุณาเลือกสัตว์เลี้ยง");
    if (!datetimeInput) return alert("กรุณาเลือกวันที่และเวลา");

    const [date, time] = datetimeInput.split("T");
    const petObj = pets.find(p => p._id === petId) || { _id: "", name: "ไม่ทราบ", type: "unknown", emoji: "🐾" };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://api.petfolio.wisitdev.com/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, date, time, petId: petObj._id, details, userId }),
      });

      if (!response.ok) {
        const errData: { error?: string } = await response.json();
        throw new Error(errData.error || "Failed to save reminder");
      }

      const savedReminder: RawReminder = await response.json();
      setReminders(prev => [
        ...prev,
        {
          _id: savedReminder._id,
          petId: petObj,
          title: savedReminder.title || title,
          date: savedReminder.date || date,
          time: savedReminder.time || time,
          details: savedReminder.details || details
        }
      ]);

      // Reset form & close modal
      setSelectedDate("");
      setSelectedPetId("");
      setSelectedType("");
      setNotePlaceholder("รายละเอียดเพิ่มเติม...");
      setIsReminderModalOpen(false);

    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`เกิดข้อผิดพลาดในการบันทึกกิจกรรม: ${error.message}`);
      } else {
        alert(`เกิดข้อผิดพลาดไม่ทราบชนิด`);
      }
    }
  };

  // --- Mark Reminder as Complete ---
  const handleMarkComplete = async (id: string) => {
    if (!userId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://api.petfolio.wisitdev.com/api/reminders/${id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error("ไม่สามารถทำเครื่องหมายเสร็จแล้วได้");

      const completedReminder: RawReminder = await res.json();

      let pet: Pet | null = null;
      if (completedReminder.petId) {
        pet = pets.find(p => p._id === completedReminder.petId?._id) || {
          _id: "",
          name: completedReminder.petName || "ไม่ทราบ",
          type: "unknown",
          emoji: completedReminder.petType ? getPetEmoji(completedReminder.petType) : "🐾"
        };
      }

      const reminderObj: ReminderType = {
        _id: completedReminder._id,
        petId: pet,
        title: completedReminder.title || "กิจกรรม",
        date: completedReminder.date || "",
        time: completedReminder.time || "",
        details: completedReminder.details || ""
      };

      setCompletedReminders(prev => [...prev, reminderObj]);
      setReminders(prev => prev.filter(r => r._id !== id));

    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
      } else {
        alert(`เกิดข้อผิดพลาดไม่ทราบชนิด`);
      }
    }
  };

  // --- Dashboard Counts ---
  const now = new Date();
  const countUrgent = reminders.filter(r => new Date(`${r.date}T${r.time}`) < now).length;
  const countToday = reminders.filter(r => new Date(`${r.date}T${r.time}`).toDateString() === now.toDateString()).length;
  const countThisWeek = reminders.filter(r => {
    const datetime = new Date(`${r.date}T${r.time}`);
    const day = now.getDay();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - day); weekStart.setHours(0,0,0,0);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);
    return datetime >= weekStart && datetime <= weekEnd;
  }).length;
  const countCompleted = completedReminders.length;

  // --- Render ---
  return (
    <div className="section font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Cards */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Dashboard Cards */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 justify-center max-w-6xl mx-auto">

    {/* เร่งด่วน */}
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md flex flex-col items-center justify-center text-center transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
      <AiOutlineAlert className="text-4xl text-red-500 mb-4" />
      <div className="text-lg font-semibold text-red-600 mb-1">เร่งด่วน</div>
      <div className="text-md text-red-600">{countUrgent} รายการ</div>
      <div className="text-sm text-gray-500 pt-3">*รายการที่เลยกำหนด*</div>
    </div>

    {/* วันนี้ */}
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md flex flex-col items-center justify-center text-center transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
      <AiOutlineClockCircle className="text-4xl text-orange-500 mb-4" />
      <div className="text-lg font-semibold text-orange-600 mb-1">วันนี้</div>
      <div className="text-md text-orange-500">{countToday} รายการ</div>
      <div className="text-sm text-gray-500 pt-3">*รายการที่กำหนดไว้ในวันนี้*</div>
    </div>

    {/* สัปดาห์นี้ */}
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md flex flex-col items-center justify-center text-center transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
      <AiOutlineCalendar className="text-4xl text-blue-500 mb-4" />
      <div className="text-lg font-semibold text-blue-600 mb-1">สัปดาห์นี้</div>
      <div className="text-md text-blue-500">{countThisWeek} รายการ</div>
      <div className="text-sm text-gray-500 pt-3">*รายการที่กำหนดไว้ในสัปดาห์นี้*</div>
    </div>

    {/* เสร็จแล้ว */}
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md flex flex-col items-center justify-center text-center transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
      <AiOutlineCheckCircle className="text-4xl text-green-500 mb-4" />
      <div className="text-lg font-semibold text-green-600 mb-1">เสร็จแล้ว</div>
      <div className="text-md text-green-500">{countCompleted} รายการ</div>
      <div className="text-sm text-gray-500 pt-3">*รายการที่เสร็จสิ้นแล้ว*</div>
    </div>

  </div>
</div>


        {/* Header + Add Button */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">การแจ้งเตือน</h2>
          <button onClick={() => setIsReminderModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg">✚ เพิ่มการแจ้งเตือน</button>
        </div>

        {/* Reminder List */}
        {isLoading ? <p>กำลังโหลด...</p> :
          reminders.length === 0 ? <p className="text-gray-500">ไม่พบการแจ้งเตือน</p> :
          <div className="space-y-4">
            {reminders.sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()).map(r => {
              const pet = r.petId!;
              const datetime = new Date(`${r.date}T${r.time}`);
              const isOverdue = datetime < now;
              const isToday = datetime.toDateString() === now.toDateString();

              return (
                <div key={r._id} className={`bg-white rounded-xl p-6 shadow-lg flex justify-between items-center ${isOverdue ? "border-l-4 border-red-500" : isToday ? "border-l-4 border-orange-500" : ""}`}>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{pet?.emoji || "🐾"}</div>
                    <div>
                      <h3 className="font-bold text-gray-800">หัวข้อการแจ้งเตือน: {r.title}</h3>
                      <p className="text-gray-600">ชื่อสัตว์เลี้ยง: {pet?.name || "ไม่ทราบ"}</p>
                      <p className="text-sm text-gray-500">วันที่: {datetime.toLocaleString("th-TH")}</p>
                      {r.details && <p className="text-sm text-gray-600 mt-1">รายละเอียด: {r.details}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {isOverdue && <span className="text-red-600 font-bold">เลยกำหนด !</span>}
                    <button onClick={() => handleMarkComplete(r._id)} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">เสร็จแล้ว</button>
                  </div>
                </div>
              );
            })}
          </div>
          
        }

        {/* Reminder Modal */}
        {isReminderModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">เพิ่มการแจ้งเตือนใหม่</h3>
              <form onSubmit={handleFormSubmit} className="space-y-4">

                 {/* Type select */}
                <div>
                    <label className="block text-gray-700 font-medium mb-2" >ชื่อการแจ้งเตือน *</label>
                    <input type="text" placeholder="กรอกชื่อการแจ้งเตือน" name="title" className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500" required />
                </div>

                {/* Pet select */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">เลือกสัตว์เลี้ยง *</label>
                  <select name="petId" className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500" value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)} required>
                    <option value="">-- เลือกสัตว์เลี้ยง --</option>
                    {pets.length > 0 ? pets.map(p => <option key={p._id} value={p._id}>{p.name} {p.emoji}</option>) : <option disabled>คุณยังไม่มีสัตว์เลี้ยง</option>}
                  </select>
                </div>

                {/* Datetime */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">วันและเวลา *</label>
                  <input type="datetime-local" name="datetime" className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} required />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">รายละเอียด</label>
                  <textarea name="note" placeholder={notePlaceholder} className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"></textarea>
                </div>

                {/* Buttons */}
                <div className="w-full flex justify-end space-x-4 pt-4">
                     <button
                         type="button"
                         onClick={() => setIsReminderModalOpen(false)}
                         className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl"
                     >
                         ยกเลิก
                     </button>
                     <button
                         type="submit"
                         className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                     >
                         บันทึก
                     </button>
                  </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
