"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Image from "next/image";
import {jwtDecode} from "jwt-decode";

interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  status: string;
  exp: number;
}

interface Pet {
  _id: string;
  name: string;
}

interface Post {
  _id: string;
  owner: string;
  ownerUsername: string;
  PostDesc: string;
  pets: Pet[];
  images: string[];
}

export default function Community() {
  const [currentUser, setCurrentUser] = useState<{ _id: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [openImage, setOpenImage] = useState<string | null>(null);
  const [postDesc, setPostDesc] = useState("");
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const BASE_URL = "https://petfolioforportweb.onrender.com";

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    setToken(storedToken);
    if (storedUserId) setCurrentUser({ _id: storedUserId });
  }, []);

  useEffect(() => {
    if (!token) {
      router.push("/");
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);

      if (decoded.status !== "active") {
        router.push("/banpage");
        return;
      }

      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        router.push("/");
      }
    } catch (err) {
      console.error("Invalid token", err);
      router.push("/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (!token || !currentUser) return;

    fetch(`${BASE_URL}/api/pets/user/${currentUser._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: Pet[]) => setPets(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching pets:", err));
  }, [token, currentUser]);

  useEffect(() => {
    if (!token) return;

    fetch(`${BASE_URL}/api/community-posts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: Post[]) => Array.isArray(data) && setPosts(data.reverse()))
      .catch((err) => console.error("Error fetching posts:", err));
  }, [token]);

  useEffect(() => {
    if (!token || !currentUser) return;

    fetch(`${BASE_URL}/api/community-posts/user/${currentUser._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: Post[]) => setMyPosts(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching my posts:", err));
  }, [token, currentUser]);

  const handlePetChange = (petId: string) => {
    setSelectedPets((prev) =>
      prev.includes(petId) ? prev.filter((p) => p !== petId) : [...prev, petId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;

  // แปลง FileList เป็น Array<File> แบบ Type-safe
  setNewImages((prev) => [...prev, ...Array.from(files)]);
};


  const handleRemoveNewImage = (idx: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentUser) return;

    if (selectedPets.length === 0) {
      alert("กรุณาเลือกสัตว์เลี้ยงอย่างน้อย 1 ตัว");
      return;
    }

    if (!postDesc.trim() && newImages.length === 0) {
      alert("กรุณากรอกคำอธิบายหรือเพิ่มรูปภาพอย่างน้อย 1 อย่าง");
      return;
    }

    const formData = new FormData();
    formData.append("PostDesc", postDesc);
    formData.append("owner", currentUser._id);
    selectedPets.forEach((petId) => formData.append("pets", petId));
    newImages.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch("https://petfolioforportweb.onrender.com/api/community-posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      const newPost: Post = await res.json();
      setPosts((prev) => [newPost, ...prev]);
      setMyPosts((prev) => [newPost, ...prev]);
      setPostDesc("");
      setNewImages([]);
      setSelectedPets([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!token) return;
    if (!confirm("คุณแน่ใจว่าต้องการลบโพสต์นี้?")) return;

    try {
      const res = await fetch(`https://petfolioforportweb.onrender.com/api/community-posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete post");

      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setMyPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleEdit = (postId: string) => {
    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      return;
    }
    router.push(`/community/editPost/${postId}`);
  };

  return (
    <div className="font-sans flex flex-col min-h-screen w-full bg-[#f5f5f5]">
      <Navbar />
      <div className="flex justify-center w-full bg-[#f5f5f5] py-8 ">
        <div className="flex gap-6 w-full max-w-7xl px-6 sm:px-6 lg:px-8 ">
          {/* Sidebar - Create Post */}
          <div className="flex-none w-60 sticky top-32 self-start">
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div className="p-4">
                <p className="text-lg font-bold text-gray-800 mb-4">สร้างโพสต์</p>
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
                              className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-gray-700">เลือกสัตว์เลี้ยง:</label>
                    {pets.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mt-1 overflow-y-auto" style={{ maxHeight: `${3 * 2}rem` }}>
                        {pets.map((pet) => (
                          <label
                            key={pet._id}
                            className={`px-3 py-1 rounded-full border text-center text-xs truncate transition ${
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

                  <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl shadow-md transition mt-2">
                    โพสต์
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="border-x border-gray-300 flex-1 ">
            <div className="w-full max-w-2xl top-32 space-y-6  px-4">
              <p className="text-lg font-bold text-gray-800 mb-4">ฟีดทั้งหมด</p>
              {posts.length === 0 ? (
                <p className="p-4 text-center text-gray-500">ยังไม่มีโพสต์</p>
              ) : (
                posts.map((post) => (
                  <div
                    key={post._id}
                    className="relative bg-white rounded-2xl shadow-md p-4 flex flex-col gap-3 border border-gray-200"
                  >
                    <p className="font-semibold text-gray-800 text-2xl">{post.ownerUsername}</p>
                    <p className="text-gray-700 text-base text-md">{post.PostDesc}</p>
                    {post.images.length > 0 && (
                      <div className="mt-2">
                        {/* Images rendering logic */}
                        <div className="grid grid-cols-2 gap-2">
                          {post.images.slice(0, 4).map((img, idx) => (
                            <div key={idx} className="relative">
                              <Image
                                src={`https://petfolioforportweb.onrender.com${img}`}
                                alt={`post-${idx}`}
                                className="w-full h-48 object-cover rounded-xl cursor-pointer"
                                onClick={() => setOpenImage(`https://petfolioforportweb.onrender.com${img}`)}
                              />
                              {idx === 3 && post.images.length > 4 && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl text-white text-2xl font-semibold">
                                  +{post.images.length - 4}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {post.pets.length > 0 && (
                      <p className="text-gray-600 text-md mt-2 text-right">
                        ชื่อสัตว์เลี้ยง: {post.pets.map((p) => p.name).join(", ")}
                      </p>
                    )}
                  </div>
                ))
              )}

              {openImage && (
                <div
                  className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50"
                  onClick={() => setOpenImage(null)}
                >
                  <Image
                    src={openImage}
                    alt="fullscreen"
                    className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* My Posts */}
          <div className="flex-none w-60 sticky top-32">
            <p className="text-lg font-bold text-gray-800 mb-4">โพสต์ของฉัน</p>
            <div className="space-y-4">
              {currentUser ? (
                myPosts.length === 0 ? (
                  <p className="text-gray-500">คุณยังไม่มีโพสต์</p>
                ) : (
                  myPosts.map((post) => (
                    <div
                      key={post._id}
                      className="relative bg-white rounded-2xl shadow-md p-4 flex flex-col gap-2 border border-gray-200"
                    >
                      <p className="font-semibold text-gray-800 text-sm">
                        ชื่อสัตว์เลี้ยง: {post.pets.map((p) => p.name).join(", ")}
                      </p>
                      <p className="text-gray-700 text-sm">{post.PostDesc}</p>

                      {post.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {post.images.slice(0, 4).map((img, idx) => (
                            <div key={idx} className="relative">
                              <Image
                                src={`https://petfolioforportweb.onrender.com${img}`}
                                alt={`post-${idx}`}
                                className="w-full h-32 object-cover rounded-xl cursor-pointer"
                                onClick={() => setOpenImage(`https://petfolioforportweb.onrender.com${img}`)}
                              />
                              {idx === 3 && post.images.length > 4 && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl text-white text-2xl font-semibold">
                                  +{post.images.length - 4}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => handleEdit(post._id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-3 rounded-lg text-sm"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(post._id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded-lg text-sm"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <p className="text-gray-500">กำลังโหลดข้อมูลผู้ใช้...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
