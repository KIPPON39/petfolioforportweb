"use client";
import React from "react";
import Image from "next/image";

interface Pet {
  _id: string;
  name: string;
}

interface Props {
  postDesc: string;
  setPostDesc: (v: string) => void;
  pets: Pet[];
  selectedPets: string[];
  handlePetChange: (id: string) => void;
  newImages: File[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveNewImage: (idx: number) => void;
  handleSubmit: (e: React.FormEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function CreatePostForm({
  postDesc,
  setPostDesc,
  pets,
  selectedPets,
  handlePetChange,
  newImages,
  handleFileChange,
  handleRemoveNewImage,
  handleSubmit,
  fileInputRef,
}: Props) {
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <textarea
        value={postDesc}
        onChange={(e) => setPostDesc(e.target.value)}
        placeholder="เขียนคำบรรยายภาพ..."
        className="text-black w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
        rows={4}
      />
      <label className="cursor-pointer flex items-center gap-2 text-purple-600 hover:text-purple-500 font-medium">
        ✚ อัปโหลดรูปภาพ <br />
        (สูงสุด 4 ภาพ)
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {newImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-1">
          {newImages.map((img, idx) => {
            const url = URL.createObjectURL(img);
            return (
              <div
                key={idx}
                className="relative w-full pb-[100%] rounded-md overflow-hidden border border-gray-200 shadow-sm"
              >
                <Image
                  src={url}
                  alt={`preview-${idx}`}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(idx)}
                  className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <label className="font-semibold text-gray-700 text-sm md:text-base">
          เลือกสัตว์เลี้ยง:
        </label>
        {pets.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 mt-2 overflow-y-auto max-h-48">
            {pets.map((pet) => (
              <label
                key={pet._id}
                className={`px-3 py-2 rounded-full border text-center text-xs md:text-sm truncate transition ${
                  selectedPets.includes(pet._id)
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                } cursor-pointer`}
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
        ) : (
          <p className="text-gray-500 text-sm mt-1">คุณยังไม่มีสัตว์เลี้ยง</p>
        )}
      </div>

      <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl shadow-md transition mt-2 font-medium">
        โพสต์
      </button>
    </form>
  );
}
