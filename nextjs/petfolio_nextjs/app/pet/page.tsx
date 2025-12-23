"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

type PetType = "dog" | "cat" | "bird" | "fish" | "rabbit" | "hamster";

type Pet = {
  _id: string;
  id: number;
  name: string;
  type: PetType;
  breed: string;
  birthdate: string;
  weight: number | null;
  gender: string;
  personality: string;
  medicalConditions: string;
  privacy: string;
  emoji: string;
  ownerId?: string;
};

const typeEmojis: Record<PetType, string> = {
  dog: "🐕",
  cat: "🐱",
  bird: "🐦",
  fish: "🐠",
  rabbit: "🐰",
  hamster: "🐹",
};

type FormState = {
  name: string;
  type: PetType | "";
  breed: string;
  birthdate: string;
  weight: string;
  gender: string;
  personality: string;
  medicalConditions: string;
  privacy: string;
};

export default function PetApp() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState<FormState>({
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

  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // โหลด userId / token
  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
    setToken(localStorage.getItem("token"));
  }, []);

  // ดึง pets ของ user
  useEffect(() => {
    if (!userId || !token) return;

    const fetchPets = async () => {
      try {
        const res = await fetch(`https://petfolioforportweb.onrender.com/api/pets/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch pets");

        const data: Pet[] = await res.json();

        const petsWithEmoji = data.map((pet, index) => ({
          ...pet,
          id: index + 1,
          emoji: typeEmojis[pet.type] || "🐾",
        }));

        setPets(petsWithEmoji);
      } catch (err) {
        console.error(err);
        setPets([]);
      }
    };

    fetchPets();
  }, [userId, token]);

  const addPet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId || !token) return alert("กรุณา login ก่อน");

    const newPet = {
      ...form,
      type: form.type as PetType,
      weight: form.weight ? Number(form.weight) : null,
      ownerId: userId,
    };

    try {
      const res = await fetch("https://petfolioforportweb.onrender.com/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newPet),
      });
      if (!res.ok) throw new Error("Failed to add pet");

      const savedPet: { pet: Pet } = await res.json();

      const petWithEmoji: Pet = {
        ...savedPet.pet,
        emoji: typeEmojis[savedPet.pet.type] || "🐾",
      };

      setPets((prev) => [...prev, petWithEmoji]);
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
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถเพิ่มสัตว์เลี้ยงได้ โปรดลองอีกครั้ง");
    }
  };

  const openEditModal = (pet: Pet) => {
    setEditingPet(pet);
    setForm({
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      birthdate: pet.birthdate,
      weight: pet.weight ? String(pet.weight) : "",
      gender: pet.gender,
      personality: pet.personality,
      medicalConditions: pet.medicalConditions,
      privacy: pet.privacy,
    });
    setShowEditModal(true);
  };

  const editPet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPet) return;

    const updatedPet = {
      ...form,
      type: form.type as PetType,
      weight: form.weight ? Number(form.weight) : null,
    };

    try {
      const res = await fetch(`https://petfolioforportweb.onrender.com/api/pets/${editingPet._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPet),
      });
      if (!res.ok) throw new Error("Failed to update pet");

      const savedPet: Pet = await res.json();
      setPets((prev) =>
        prev.map((p) =>
          p._id === editingPet._id
            ? { ...savedPet, emoji: typeEmojis[savedPet.type] || "🐾" }
            : p
        )
      );

      setShowEditModal(false);
      setEditingPet(null);
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
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถแก้ไขสัตว์เลี้ยงได้ โปรดลองอีกครั้ง");
    }
  };

  const deletePet = async (petId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสัตว์เลี้ยงตัวนี้?")) return;

    try {
      const res = await fetch(`https://petfolioforportweb.onrender.com/api/pets/${petId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete pet");

      setPets((prev) => prev.filter((p) => p._id !== petId));
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถลบสัตว์เลี้ยงได้ โปรดลองอีกครั้ง");
    }
  };

  const viewPetDetails = (pet: Pet) => {
    setSelectedPet(pet);
    setShowDetailModal(true);
  };






    return (
        <>
            <div className="font-sans  bg-[#fffff]">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">สัตว์เลี้ยงของฉัน</h2>
                        <button
                            onClick={() => {
                                setForm({  // รีเซ็ตฟอร์มเป็นค่าเริ่มต้น
                                    name: "",
                                    type: "",
                                    breed: "",
                                    birthdate: "",
                                    weight: "",
                                    gender: "",
                                    personality: "",
                                    medicalConditions: "",
                                    privacy: "public",
                                });
                                setShowModal(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
                        >
                            ✚ เพิ่มสัตว์เลี้ยงใหม่
                        </button>

                    </div>

                    {/* Pets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pets.map((pet) => (
                            <div key={pet._id} className="bg-white rounded-2xl p-6 shadow-md flex flex-col items-center">
                                <div className="text-5xl mb-2">{pet.emoji}</div>
                                <h3 className="text-black text-xl font-bold">ชื่อสัตว์เลี้ยง: {pet.name}</h3>
                                <p className="text-gray-500">สายพันธุ์: {pet.breed}</p>
                                <p className="text-gray-500 text-md mt-1">น้ำหนัก: {pet.weight ?? "-"} กก.</p>
                                <p className="text-gray-500 text-md">เพศ: {pet.gender || "-"}</p>

                                {/* Buttons */}
                                <div className="flex space-x-2 mt-4">
                                    <button
                                        onClick={() => viewPetDetails(pet)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-400 text-white rounded-xl text-sm"
                                    >
                                        ดูรายละเอียด
                                    </button>

                                    <button
                                        onClick={() => openEditModal(pet)}
                                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm"
                                    >
                                        แก้ไขข้อมูล
                                    </button>

                                    <button
                                        onClick={() => deletePet(pet._id)}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm"
                                    >
                                        ลบ
                                    </button>

                                </div>
                            </div>
                        ))}
                    </div>


                    {/* Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
                                <h3 className="text-2xl font-bold text-gray-800 mb-6">เพิ่มสัตว์เลี้ยงใหม่</h3>
                                <form className="space-y-6" onSubmit={addPet}>
                                    {/* Name */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">ชื่อ</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="ชื่อสัตว์เลี้ยง"
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {/* Type */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">ประเภท *</label>
                                        <select
                                            name="type"
                                            value={form.type}
                                            onChange={handleChange}
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">เลือกประเภทสัตว์</option>
                                            <option value="dog">สุนัข 🐕</option>
                                            <option value="cat">แมว 🐱</option>
                                            <option value="bird">นก 🐦</option>
                                            <option value="fish">ปลา 🐠</option>
                                            <option value="rabbit">กระต่าย 🐰</option>
                                            <option value="hamster">แฮมสเตอร์ 🐹</option>
                                        </select>
                                    </div>

                                    {/* Breed */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">สายพันธุ์</label>
                                        <input
                                            type="text"
                                            name="breed"
                                            value={form.breed}
                                            onChange={handleChange}
                                            placeholder="เช่น ชิวาวา, เปอร์เซีย"
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Birthdate */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">วันเกิด</label>
                                        <input
                                            type="date"
                                            name="birthdate"
                                            value={form.birthdate}
                                            onChange={handleChange}
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Weight */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">น้ำหนัก (กก.)</label>
                                        <input
                                            type="text"
                                            name="weight"
                                            value={form.weight}
                                            onChange={handleChange}
                                            step="0.1"
                                            min="0"
                                            placeholder="น้ำหนักสัตว์เลี้ยง"
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Gender */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">เพศ</label>
                                        <select
                                            name="gender"
                                            value={form.gender}
                                            onChange={handleChange}
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="">เลือกเพศ</option>
                                            <option value="male">ผู้</option>
                                            <option value="female">เมีย</option>
                                        </select>
                                    </div>

                                    {/* Personality */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">นิสัย/บุคลิกภาพ</label>
                                        <textarea
                                            name="personality"
                                            value={form.personality}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="อธิบายนิสัยและบุคลิกภาพของสัตว์เลี้ยง..."
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        ></textarea>
                                    </div>

                                    {/* Medical Conditions */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">โรคประจำตัว/อาการแพ้</label>
                                        <textarea
                                            name="medicalConditions"
                                            value={form.medicalConditions}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="ระบุโรคประจำตัว อาการแพ้ หรือข้อควรระวังทางการแพทย์..."
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        ></textarea>
                                    </div>

                                    

                                    {/* Buttons */}
                                    <div className="flex space-x-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl  transition-colors"
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

                    {/* Detail Modal */}
                    {showDetailModal && selectedPet && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-8">
                                {/* Header */}
                                <div className="mb-6 text-center">
                                    <h3 className="text-4xl font-bold text-gray-800 text-center">
                                        {selectedPet.name} {selectedPet.emoji}
                                    </h3>
                                </div>

                                {/* Details */}
                                <div className="space-y-3 text-gray-700">
                                    <div className="flex justify-between">
                                        <strong className="font-medium">ประเภท :</strong>
                                        <span className="text-end">{selectedPet.type}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <strong className="font-medium">สายพันธุ์ :</strong>
                                        <span className="text-end">{selectedPet.breed || "-"}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <strong className="font-medium">วันเกิด :</strong>
                                        <span className="text-end">{selectedPet.birthdate || "-"}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <strong className="font-medium">น้ำหนัก :</strong>
                                        <span className="text-end">{selectedPet.weight ?? "-"} กก.</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <strong className="font-medium">เพศ :</strong>
                                        <span className="text-end">{selectedPet.gender || "-"}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <strong className="font-medium">นิสัย/บุคลิกภาพ :</strong>
                                        <span className="text-end">{selectedPet.personality || "-"}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <strong className="font-medium">โรคประจำตัว/อาการแพ้ :</strong>
                                        <span className="text-end">{selectedPet.medicalConditions || "-"}</span>
                                    </div>

                                </div>


                                {/* Close Button */}
                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="px-4 py-2 hover:bg-gray-50   border border-gray-300 text-gray-700 rounded-xl  transition"
                                    >
                                        ปิด
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                    {showEditModal && editingPet && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
                                <h3 className="text-black text-2xl font-bold mb-6">แก้ไขข้อมูล {editingPet.name}</h3>
                                <form className="space-y-6" onSubmit={editPet}>
                                    {/* Name */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">ชื่อ</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {/* Type */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">ประเภท</label>
                                        <select
                                            name="type"
                                            value={form.type}
                                            onChange={handleChange}
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">เลือกประเภทสัตว์</option>
                                            <option value="dog">สุนัข 🐕</option>
                                            <option value="cat">แมว 🐱</option>
                                            <option value="bird">นก 🐦</option>
                                            <option value="fish">ปลา 🐠</option>
                                            <option value="rabbit">กระต่าย 🐰</option>
                                            <option value="hamster">แฮมสเตอร์ 🐹</option>
                                        </select>
                                    </div>

                                    {/* Breed */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">สายพันธุ์</label>
                                        <input
                                            type="text"
                                            name="breed"
                                            value={form.breed}
                                            onChange={handleChange}
                                            placeholder="เช่น ชิวาวา, เปอร์เซีย"
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Birthdate */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">วันเกิด</label>
                                        <input
                                            type="date"
                                            name="birthdate"
                                            value={form.birthdate}
                                            onChange={handleChange}
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Weight */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">น้ำหนัก (กก.)</label>
                                        <input
                                            type="text"
                                            name="weight"
                                            value={form.weight}
                                            onChange={handleChange}
                                            step="0.1"
                                            min="0"
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Gender */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">เพศ</label>
                                        <select
                                            name="gender"
                                            value={form.gender}
                                            onChange={handleChange}
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="">เลือกเพศ</option>
                                            <option value="male">ผู้</option>
                                            <option value="female">เมีย</option>
                                        </select>
                                    </div>

                                    {/* Personality */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">นิสัย/บุคลิกภาพ</label>
                                        <textarea
                                            name="personality"
                                            value={form.personality}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="อธิบายนิสัยและบุคลิกภาพของสัตว์เลี้ยง..."
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        ></textarea>
                                    </div>

                                    {/* Medical Conditions */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">โรคประจำตัว/อาการแพ้</label>
                                        <textarea
                                            name="medicalConditions"
                                            value={form.medicalConditions}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="ระบุโรคประจำตัว อาการแพ้ หรือข้อควรระวังทางการแพทย์..."
                                            className="text-black w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        ></textarea>
                                    </div>

                                

                                    {/* ... */}
                                    <div className="flex space-x-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditModal(false)}
                                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-colors"
                                        >
                                            บันทึกการแก้ไข
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}



                </div>
            </div>

        </>
    );
}
