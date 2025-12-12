"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";
export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id;

  const [token, setToken] = useState<string | null>(null);
  const [postDesc, setPostDesc] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]); // รูปเดิมจาก server
  const [newImages, setNewImages] = useState<File[]>([]); // รูปใหม่ที่เลือก
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [pets, setPets] = useState<{ _id: string; name: string }[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token || !postId) return;

    // ดึงข้อมูลโพสต์
    fetch(`http://localhost:3002/api/community-posts/communityposts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (!data) return;
        setPostDesc(data.PostDesc || "");
        setSelectedPets(data.pets?.map((p: any) => p._id) || []);
        setExistingImages(data.images || []);
        setNewImages([]);
      })
      .catch(err => console.error("Error fetching post:", err));

    // ดึงสัตว์เลี้ยงผู้ใช้
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    fetch(`http://localhost:3002/api/pets/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setPets(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching pets:", err));
  }, [token, postId]);
//เปลี่ยนสัตว์ที่post
  const handlePetChange = (petId: string) => {
    setSelectedPets(prev =>
      prev.includes(petId) ? prev.filter(p => p !== petId) : [...prev, petId]
    );
  };
//ซับมิทแก้ไขโพสต์
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !postId) return;

    if (selectedPets.length === 0) {
      alert("กรุณาเลือกสัตว์เลี้ยงอย่างน้อย 1 ตัว");
      return;
    }

    const hasText = postDesc.trim().length > 0;
    const hasImages = existingImages.length + newImages.length > 0;
    if (!hasText && !hasImages) {
      alert("กรุณากรอกคำอธิบายหรือเพิ่มรูปภาพอย่างน้อย 1 อย่าง");
      return;
    }

    const formData = new FormData();
    formData.append("PostDesc", postDesc);
    selectedPets.forEach(petId => formData.append("pets", petId));

    existingImages.forEach(img => formData.append("existingImages", img));
    newImages.forEach(img => formData.append("images", img));

    try {
      const res = await fetch(
        `http://localhost:3002/api/community-posts/updatePost/${postId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "แก้ไขโพสต์ไม่สำเร็จ");
        return;
      }

      const updatedPost = await res.json();
      console.log("Updated post:", updatedPost);
      router.push("/community");
    } catch (err) {
      console.error(" Error updating post:", err);
    }
  };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.currentTarget.files;
  if (!files) return;

  // รวมไฟล์ทั้งหมด (รูปเดิม + รูปใหม่ + รูปที่เพิ่งเลือก)
  const totalImages = existingImages.length + newImages.length + files.length;

  // ถ้ามากกว่า 4 → แจ้งเตือนและไม่เพิ่ม
  if (totalImages > 4) {
    alert("ใส่ภาพได้สูงสุด 4 ภาพ");
    return;
  }

  setNewImages(prev => [...prev, ...Array.from(files)]);
};

//ลบรูป
  const handleRemoveImage = (idx: number, type: "existing" | "new") => {
    if (type === "existing") {
      setExistingImages(prev => prev.filter((_, i) => i !== idx));
    } else {
      setNewImages(prev => prev.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="font-sans min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md text-black">
        <h1 className="text-2xl font-bold mb-6 text-center">แก้ไขโพสต์</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={postDesc}
            onChange={e => setPostDesc(e.target.value)}
            placeholder="เขียนคำบรรยายภาพ..."
            className="w-full border border-gray-300 rounded-xl p-3 text-black text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            rows={4}
          />

          {/* อัปโหลดรูป */}
          <label className="cursor-pointer text-purple-600 hover:text-purple-500">
            ✚ อัปโหลดรูปภาพ
            <br />(สูงสุด 4 ภาพ)
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* แสดง preview */}
          {(existingImages.length + newImages.length) > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-1">
              {existingImages.map((img, idx) => {
                const url = `http://localhost:3002${img}`;
                return (
                  <div
                    key={`existing-${idx}`}
                    className="relative w-full pb-[100%] rounded-md overflow-hidden border border-gray-200 shadow-sm"
                    >
                    <Image src={url} 
                      alt={`รูปสัตว์เลี้ยง ${idx + 1}`} 
                      fill
                      className="object-cover"
                     />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx, "existing")}
                      className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
              {newImages.map((img, idx) => {
                const url = URL.createObjectURL(img);
                return (
                  <div
                    key={`new-${idx}`}
                    className="relative w-full pb-[100%] rounded-md overflow-hidden border border-gray-200 shadow-sm"
                  >
                    <Image
                      src={url}                  // URL ของรูป
                      alt={`รูปใหม่ ${idx + 1}`} // ใส่ alt
                      fill                        // ทำให้เต็ม container
                      className="object-cover"    // ใช้ object-cover เหมือนเดิม
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx, "new")}
                      className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* เลือกสัตว์เลี้ยง */}
          <div>
            <label className="font-semibold">เลือกสัตว์เลี้ยง:</label>
            <div className="grid grid-cols-2 gap-2 mt-1 max-h-24 overflow-y-auto">
              {pets.map(pet => (
                <label
                  key={pet._id}
                  className={`px-3 py-1 rounded-full border text-xs text-center cursor-pointer ${
                    selectedPets.includes(pet._id)
                      ? "bg-purple-600 text-white border-purple-600"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    value={pet._id}
                    checked={selectedPets.includes(pet._id)}
                    onChange={() => handlePetChange(pet._id)}
                    className="hidden"
                  />
                  {pet.name}
                </label>
              ))}
            </div>
          </div>

          {/* ปุ่มบันทึก / ยกเลิก */}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 flex-1  py-2 rounded-xl font-medium"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl font-medium"
            >
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
