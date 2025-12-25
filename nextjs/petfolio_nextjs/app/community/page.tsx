"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Image from "next/image";
import {jwtDecode} from "jwt-decode";
import CreatePostForm from "../components/CreatePostForm";


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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMyPostsModal, setShowMyPostsModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);

  const BASE_URL = "https://petfolioforportweb.onrender.com";

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");

    if (storedToken) setToken(storedToken);
    if (storedUserId) setCurrentUser({ _id: storedUserId });

    setLoadingAuth(false);
  }, []);

  useEffect(() => {
    if (loadingAuth) return;

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);

      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (decoded.status !== "active") {
        router.push("/banpage");
        return;
      }
    } catch (err) {
      console.error("Invalid token", err);
      router.push("/login");
    }
  }, [token, loadingAuth, router]);

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
      setShowCreateModal(false);
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
      <div className="flex justify-center w-full bg-[#f5f5f5] py-4 md:py-8">
        <div className="w-full max-w-7xl px-3 md:px-6 lg:px-8">
          {/* Desktop Layout (lg and above) */}
          <div className="hidden lg:flex gap-6">
            {/* Sidebar - Create Post */}
            <div className="flex-none w-60 sticky top-32 self-start">
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <p className="text-lg font-bold text-gray-800 mb-4">สร้างโพสต์</p>
                  <CreatePostForm
                    postDesc={postDesc}
                    setPostDesc={setPostDesc}
                    pets={pets}
                    selectedPets={selectedPets}
                    handlePetChange={handlePetChange}
                    newImages={newImages}
                    handleFileChange={handleFileChange}
                    handleRemoveNewImage={handleRemoveNewImage}
                    handleSubmit={handleSubmit}
                    fileInputRef={fileInputRef}
                  />
                </div>
              </div>
            </div>

            {/* Main Feed */}
            <div className="border-x border-gray-300 flex-1">
              <div className="space-y-6 px-4">
                <p className="text-lg font-bold text-gray-800 mb-4">ฟีดทั้งหมด</p>
                {posts.length === 0 ? (
                  <p className="p-4 text-center text-gray-500">ยังไม่มีโพสต์</p>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post._id}
                      className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-3 border border-gray-200"
                    >
                      <p className="font-semibold text-gray-800 text-2xl">{post.ownerUsername}</p>
                      <p className="text-gray-700 text-base">{post.PostDesc}</p>
                      {post.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {post.images.slice(0, 4).map((img, idx) => (
                            <div key={idx} className="relative">
                              <Image
                                src={img}                                alt={`post-${idx}`}
                                className="w-full h-48 object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
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
                      {post.pets.length > 0 && (
                        <p className="text-gray-600 text-sm mt-2 text-right">
                          ชื่อสัตว์เลี้ยง: {post.pets.map((p) => p.name).join(", ")}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* My Posts */}
            <div className="flex-none w-60 sticky top-32 self-start">
              <p className="text-lg font-bold text-gray-800 mb-4">โพสต์ของฉัน</p>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {currentUser ? (
                  myPosts.length === 0 ? (
                    <p className="text-gray-500 text-sm">คุณยังไม่มีโพสต์</p>
                  ) : (
                    myPosts.map((post) => (
                      <div
                        key={post._id}
                        className="bg-white rounded-2xl shadow-md p-3 flex flex-col gap-2 border border-gray-200"
                      >
                        <p className="font-semibold text-gray-800 text-xs">
                          ชื่อสัตว์เลี้ยง: {post.pets.map((p) => p.name).join(", ")}
                        </p>
                        <p className="text-gray-700 text-xs">{post.PostDesc}</p>

                        {post.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {post.images.slice(0, 4).map((img, idx) => (
                              <div key={idx} className="relative">
                                <Image
                                  src={img}                                  alt={`post-${idx}`}
                                  className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                                  onClick={() => setOpenImage(`https://petfolioforportweb.onrender.com${img}`)}
                                />
                                {idx === 3 && post.images.length > 4 && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg text-white text-lg font-semibold">
                                    +{post.images.length - 4}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => handleEdit(post._id)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-2 rounded-lg text-xs"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(post._id)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-2 rounded-lg text-xs"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  <p className="text-gray-500 text-sm">กำลังโหลดข้อมูลผู้ใช้...</p>
                )}
              </div>
            </div>
          </div>

          {/* Tablet Layout (md to lg) */}
          <div className="hidden md:flex lg:hidden flex-col gap-6">
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-xl"
              >
                + สร้างโพสต์
              </button>
              <button
                onClick={() => setShowMyPostsModal(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl"
              >
                โพสต์ของฉัน
              </button>
            </div>

            {/* Main Feed */}
            <div className="space-y-4">
              <p className="text-lg font-bold text-gray-800">ฟีดทั้งหมด</p>
              {posts.length === 0 ? (
                <p className="p-4 text-center text-gray-500">ยังไม่มีโพสต์</p>
              ) : (
                posts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-3 border border-gray-200"
                  >
                    <p className="font-semibold text-gray-800 text-xl">{post.ownerUsername}</p>
                    <p className="text-gray-700 text-sm md:text-base">{post.PostDesc}</p>
                    {post.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {post.images.slice(0, 4).map((img, idx) => (
                          <div key={idx} className="relative">
                            <Image
                              src={img}                              alt={`post-${idx}`}
                              className="w-full h-40 object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
                              onClick={() => setOpenImage(`https://petfolioforportweb.onrender.com${img}`)}
                            />
                            {idx === 3 && post.images.length > 4 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl text-white text-xl font-semibold">
                                +{post.images.length - 4}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {post.pets.length > 0 && (
                      <p className="text-gray-600 text-xs md:text-sm mt-2">
                        ชื่อสัตว์เลี้ยง: {post.pets.map((p) => p.name).join(", ")}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mobile Layout (below md) */}
          <div className="md:hidden flex flex-col gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-3 rounded-lg text-sm"
              >
                + สร้าง
              </button>
              <button
                onClick={() => setShowMyPostsModal(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg text-sm"
              >
                โพสต์ของฉัน
              </button>
            </div>

            {/* Feed */}
            <div className="space-y-3">
              <p className="text-base font-bold text-gray-800">ฟีด</p>
              {posts.length === 0 ? (
                <p className="p-4 text-center text-gray-500 text-sm">ยังไม่มีโพสต์</p>
              ) : (
                posts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-white rounded-xl shadow-sm p-3 flex flex-col gap-2 border border-gray-200"
                  >
                    <p className="font-semibold text-gray-800 text-sm">{post.ownerUsername}</p>
                    <p className="text-gray-700 text-xs">{post.PostDesc}</p>
                    {post.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {post.images.slice(0, 4).map((img, idx) => (
                          <div key={idx} className="relative">
                            <Image
                              src={img}                              alt={`post-${idx}`}
                              className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                              onClick={() => setOpenImage(`https://petfolioforportweb.onrender.com${img}`)}
                            />
                            {idx === 3 && post.images.length > 4 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg text-white font-semibold text-sm">
                                +{post.images.length - 4}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {post.pets.length > 0 && (
                      <p className="text-gray-600 text-xs mt-1">
                        สัตว์: {post.pets.map((p) => p.name).join(", ")}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-4 md:p-6 w-full md:max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <p className="text-lg font-bold text-gray-800">สร้างโพสต์</p>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <CreatePostForm
                postDesc={postDesc}
                setPostDesc={setPostDesc}
                pets={pets}
                selectedPets={selectedPets}
                handlePetChange={handlePetChange}
                newImages={newImages}
                handleFileChange={handleFileChange}
                handleRemoveNewImage={handleRemoveNewImage}
                handleSubmit={handleSubmit}
                fileInputRef={fileInputRef}
              />
          </div>
        </div>
      )}

      {/* My Posts Modal */}
      {showMyPostsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-4 md:p-6 w-full md:max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <p className="text-lg font-bold text-gray-800">โพสต์ของฉัน</p>
              <button
                onClick={() => setShowMyPostsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {currentUser ? (
                myPosts.length === 0 ? (
                  <p className="text-gray-500 text-sm">คุณยังไม่มีโพสต์</p>
                ) : (
                  myPosts.map((post) => (
                    <div
                      key={post._id}
                      className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 border border-gray-200"
                    >
                      <p className="font-semibold text-gray-800 text-xs">
                        {post.pets.map((p) => p.name).join(", ")}
                      </p>
                      <p className="text-gray-700 text-xs">{post.PostDesc}</p>
                      {post.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {post.images.slice(0, 4).map((img, idx) => (
                            <Image
                              key={idx}
                              src={img}                              alt={`post-${idx}`}
                              className="w-full h-20 object-cover rounded-lg cursor-pointer"
                              onClick={() => setOpenImage(`https://petfolioforportweb.onrender.com${img}`)}
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            handleEdit(post._id);
                            setShowMyPostsModal(false);
                          }}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-2 rounded-lg text-xs"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(post._id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-2 rounded-lg text-xs"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {openImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setOpenImage(null)}
        >
          <Image
            src={openImage}
            alt="fullscreen"
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}