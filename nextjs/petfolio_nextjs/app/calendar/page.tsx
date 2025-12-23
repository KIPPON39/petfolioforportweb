"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

interface Pet {
  _id: string;
  name: string;
}

interface Reminder {
  _id: string;
  title: string;
  date: string;
  time: string;
  petId: Pet;  // ต้องเป็น Pet
  details?: string;
  userId: string;
}

export default function Calendar() {
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventsData, setEventsData] = useState<Record<string, Reminder[]>>({});
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Reminder | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      const currentUserId = localStorage.getItem("userId");

      if (!token || !currentUserId) {
        console.error("Token or userId not found. User is not logged in.");
        setUserId(null);
        setPets([]);
        setEventsData({});
        setIsLoading(false);
        return;
      }

      try {
        setUserId(currentUserId);

        // ดึงข้อมูลสัตว์เลี้ยง
        const petsResponse = await fetch(
          `https://petfolio.wisitdev.com/api/pets/user/${currentUserId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (petsResponse.ok) {
          const petsData: Pet[] = await petsResponse.json();
          setPets(petsData);
        } else {
          console.error(`Failed to fetch pets: ${petsResponse.status}`);
          setPets([]);
        }

        // ดึงข้อมูลกิจกรรม
        const eventsResponse = await fetch(
          `https://petfolio.wisitdev.com/api/reminders/user/${currentUserId}`
        );
        if (!eventsResponse.ok) throw new Error("Failed to fetch events");

        const data: Reminder[] = await eventsResponse.json();
        const formattedData = data.reduce((acc: Record<string, Reminder[]>, event) => {
          const dateKey = event.date;
          if (!acc[dateKey]) acc[dateKey] = [];
          acc[dateKey].push(event);
          return acc;
        }, {});
        setEventsData(formattedData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleViewDetails = (event: Reminder) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const showReminderModal = () => setIsReminderModalOpen(true);
  const hideReminderModal = () => setIsReminderModalOpen(false);

  const goToPreviousMonth = () =>
    setCurrentDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setCurrentDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(`${dateStr}T00:00`);
    showReminderModal();
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return alert("ไม่พบผู้ใช้งาน");

    const form = e.currentTarget;
    const datetime = (form.elements.namedItem("datetime-local") as HTMLInputElement).value;
    const [date, time] = datetime.split("T");
    const petId = (form.elements.namedItem("petId") as HTMLSelectElement).value;

    const newReminder: Reminder = {
      title: (form.elements.namedItem("title") as HTMLInputElement).value,
      date,
      time,
      petId: pets.find((p) => p._id === petId) || { _id: "", name: "" },
      details: (form.elements.namedItem("details") as HTMLTextAreaElement).value,
      userId,
      _id: Date.now().toString(),
    };

    try {
      const response = await fetch("https://petfolio.wisitdev.com/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReminder),
      });
      if (!response.ok) throw new Error("Failed to save reminder");

      hideReminderModal();
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกกิจกรรม");
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบการแจ้งเตือนนี้?")) return;

    try {
      const response = await fetch(`https://petfolio.wisitdev.com/api/reminders/${reminderId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete reminder");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการลบกิจกรรม");
    }
  };

  const renderCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();
    const firstDayIndex = firstDay.getDay();
    const calendarDays = [];

    for (let i = 0; i < firstDayIndex; i++)
      calendarDays.push(
        <div key={`empty-${i}`} className="p-2 text-center text-gray-400"></div>
      );

    for (let day = 1; day <= numDays; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      const dayEvents = eventsData[dateStr] || [];

      calendarDays.push(
        <div
          key={day}
          className="p-2 border border-gray-200 rounded-lg h-24 relative overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => handleDayClick(dateStr)}
        >
          <div className="font-bold text-gray-800">{day}</div>
          <div className="mt-1 space-y-1">
            {dayEvents.map((event) => (
              <div
                key={event._id}
                className="bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 text-xs truncate"
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return calendarDays;
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        กำลังโหลดข้อมูล...
      </div>
    );

  return (
    <div className="font-sans flex flex-col min-h-screen w-full bg-[#f5f5f5]">
      <Navbar />
      <div id="calendar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">ปฏิทินการดูแล</h2>
          <button
            onClick={showReminderModal}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
          >
            ✚ เพิ่มการแจ้งเตือน
          </button>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={goToPreviousMonth}
                className="px-4 py-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                ‹ ก่อนหน้า
              </button>
              <button
                onClick={goToNextMonth}
                className="px-4 py-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                ถัดไป ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"].map((day) => (
              <div
                key={day}
                className="rounded-2xl text-center font-medium text-gray-700 py-2 border border-gray-200 bg-gray-100"
              >
                {day}
              </div>
            ))}
          </div>

          <div id="calendarGrid" className="grid grid-cols-7 gap-1">
            {renderCalendar(currentYear, currentMonth)}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">กิจกรรมที่จะมาถึง</h3>
          <div className="space-y-4">
            {Object.values(eventsData).flat().length > 0 ? (
              Object.values(eventsData)
                .flat()
                .map((event) => (
                  <div
                    key={event._id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-xl shadow-sm gap-4"
                  >
                    <div className="text-2xl text-orange-500">⏰</div>
                    <div className="flex-1 mb-2 sm:mb-0">
                      <p className="font-medium text-gray-800">หัวข้อ: {event.title}</p>
                      <p className="text-gray-800">
                        ชื่อสัตว์เลี้ยง: {event.petId?.name || "ไม่ระบุ"}
                      </p>
                      <p className="text-sm text-gray-600">
                        วันที่: {event.date} เวลา: {event.time}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(event)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-800 text-white rounded-xl shadow flex-1"
                      >
                        ดูรายละเอียด
                      </button>
                      <button
                        onClick={() => handleDeleteReminder(event._id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow flex-1"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center text-gray-500 py-8">ไม่มีกิจกรรมที่จะมาถึง</div>
            )}
          </div>
        </div>
      </div>

      {/* Reminder Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">เพิ่มการแจ้งเตือนใหม่</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">ชื่อการแจ้งเตือน</label>
                <input
                  type="text"
                  name="title"
                  className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                  placeholder="กรอกชื่อการแจ้งเตือน"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">เลือกสัตว์เลี้ยง</label>
                <select
                  name="petId"
                  className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- เลือกสัตว์เลี้ยง --</option>
                  {pets.length > 0
                    ? pets.map((pet) => (
                        <option key={pet._id} value={pet._id}>
                          {pet.name}
                        </option>
                      ))
                    : <option value="" disabled>คุณยังไม่มีสัตว์เลี้ยง</option>}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">วันที่และเวลา</label>
                <input
                  type="datetime-local"
                  name="datetime-local"
                  value={selectedDate || ""}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">รายละเอียด</label>
                <textarea
                  name="details"
                  rows={3}
                  className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                  placeholder="รายละเอียดเพิ่มเติม..."
                ></textarea>
              </div>
              <div className="w-full flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={hideReminderModal}
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

      {/* Detail Modal */}
      {isDetailModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">รายละเอียดกิจกรรม</h3>
            <p className="text-gray-800">ชื่อกิจกรรม: {selectedEvent.title}</p>
            <p className="text-gray-800">สัตว์เลี้ยง: {selectedEvent.petId?.name || "ไม่ระบุ"}</p>
            <p className="text-gray-800">วันที่: {selectedEvent.date}</p>
            <p className="text-gray-800">เวลา: {selectedEvent.time}</p>
            <p className="text-gray-800">รายละเอียด: {selectedEvent.details}</p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
