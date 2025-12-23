"use client";
import { useEffect,useState } from "react";
import { useRouter } from 'next/navigation';
import { jwtDecode } from "jwt-decode";
import Navbar from "../components/Navbar";
import Image from "next/image";
////////////////////////////////////////////////////////////
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

/////////////////////////////////////////////////////////
interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  exp: number;
}

interface User {
  _id: string;
  userId: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  password: string;
  status:string;
  createdAt: string; 
  updatedAt: string; 
}


interface Pet {
        _id: string,
        name: string,
        type: string,
        breed: string,
        birthdate: string,
        weight: string,
        gender: string,
        personality: string,
        medicalConditions: string,
        createdAt:string, 
        updatedAt: string,
}

interface Owner {
  _id: string;
  userId: string;
  username: string;
}
interface Comment {
  _id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface CommunityPost {
  _id: string;
  PostDesc: string;
  images: string[];
  pets: Pet[];
  likes: number;
  comments: Comment[];
  owner: Owner;
  createdAt: string;
  __v: number;
  ownerUsername: string;
}

//////////////////////////////////////////////////////////
export default function Admin() {


//  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
//const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const router = useRouter();
    //เข้าสู่ระบบ
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);

      if (decoded.role !== "admin") {
        router.push("/403"); 
        return;
      }

      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        router.push("/login");
      }

    } catch (err) {
      console.error("Invalid token", err);
      router.push("/login");
    }
  }, [router]);






    ////////////////////////////////////////////////////////////////////////
    const [AllUser,SetAllUser] = useState<User[]>([]); 
    //เลือกแต่ละปี
    const [selectedUserYear, SetSelectedUserYear] = useState<number>(new Date().getFullYear());
        useEffect(() => {
            const fetchAllUser = async () => {
              try {
                const response = await fetch('https://petfolioforportweb.onrender.com/users/all_user');
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: User[] = await response.json();
                SetAllUser(data);
              } catch (err) {
                console.error(err);
              }
            };

            fetchAllUser(); 
          }, []); 



           // const user_years = Array.from(new Set(AllUser.map(u => new Date(u.createdAt).getFullYear()))).sort();
            const user_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            //จำนวนผู้ใช้แต่ละปี
            const user_register_data = {
              labels: user_months,
              datasets: [
                {
                  label: `Users in ${selectedUserYear}`,
                  data: user_months.map((m, i) => {
                    return AllUser.filter(user => {
                      const date = new Date(user.createdAt);
                      return date.getFullYear() === selectedUserYear && date.getMonth() === i;
                    }).length;
                  }),
                  fill: true,
                  backgroundColor: "rgba(75,192,192,0.2)",
                  borderColor: "rgba(75,192,192,1)"
                }
              ]
            };
////////////////////////////////////////////////////////////////////////////
    
    const [AllPet,SetAllPet] = useState<Pet[]>([]); 
            //นับจำนวนสัตว์แต่ละปี
    const [selectedPetYear, SetSelectedPetYear] = useState<number>(new Date().getFullYear());
        useEffect(() => {
            const fetchAllPet = async () => {
              try {
                const response = await fetch('https://petfolioforportweb.onrender.com/api/pets');
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: Pet[] = await response.json();
                SetAllPet(data);
              } catch (err) {
                console.error(err);
              }
            };

            fetchAllPet(); 
          }, []); 



            const years = Array.from(new Set(AllPet.map(u => new Date(u.createdAt).getFullYear()))).sort();
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            
            //นับจำนวนสัตว์ทั้งหมด
            const pet_create_data = {
              labels: months,
              datasets: [
                {
                  label: `Users in ${selectedPetYear}`,
                  data: months.map((m, i) => {
                    return AllPet.filter(pet => {
                      const date = new Date(pet.createdAt);
                      return date.getFullYear() === selectedPetYear && date.getMonth() === i;
                    }).length;
                  }),
                  fill: true,
                  backgroundColor: "rgba(75,192,192,0.2)",
                  borderColor: "rgba(75,192,192,1)"
                }
              ]
            };
    ////////////////////////////////////////////////////
    
            const [posts, setPosts] = useState<CommunityPost[]>([]);

            const [selectedPet, setSelectedPet] = useState<string | null>(null);
            //ดึงpostในcommu
            useEffect(() => {
              fetch("https://petfolioforportweb.onrender.com/api/community-posts")
                .then(res => res.json())
                .then((data: CommunityPost[]) => setPosts(data));
            }, []);





            //กรอตามสัตว์
            const filteredPosts = selectedPet
                ? posts.filter(post => post.pets.some(pet => pet.name === selectedPet))
                : posts






            //ฟังก์ชันลบโพสต์
            const handleDelete = async (postId: string) => {
              const confirmed = window.confirm("คุณแน่ใจไหมว่าต้องการลบโพสต์นี้?");
              if (!confirmed) return;

              try {
                const res = await fetch(`https://petfolioforportweb.onrender.com/api/community-posts/${postId}`, {
                  method: "DELETE"
                });
                if (res.ok) {
                  setPosts(posts.filter(p => p._id !== postId));
                } else {
                  console.error("Delete failed");
                }
              } catch (err) {
                console.error(err);
              }

            }
    ////////////////////////////////////////////////////
    //
    //
    //
    //
    //
    //
            //  ฟังชันแบนผู้ใช้
            const handleToggleStatus = async (userId: string) => {
                const user = AllUser.find(u => u.userId === userId);
                if (!user) return;

                const confirmMsg =
                  user.status === "active"
                    ? `คุณแน่ใจไหมว่าต้องการแบน ${user.username}?`
                    : `คุณแน่ใจไหมว่าต้องการปลดแบน ${user.username}?`;

                if (!window.confirm(confirmMsg)) return;

                try {
                  const res = await fetch(`https://petfolioforportweb.onrender.com/users/ban/${userId}`, {
                    method: "PUT",
                  });

                  if (res.ok) {
                    const data = await res.json();
                    SetAllUser(AllUser.map(u => u.userId === userId ? { ...u, status: data.status } : u));
                  } else {
                    console.error("Failed to toggle status");
                  }
                } catch (err) {
                  console.error(err);
                }
              };




              //  ระบบค้นหา
             const [searchTerm, setSearchTerm] = useState<string>("");
            const filteredUsers = AllUser.filter(user =>
              (user.username ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
              (user.email ?? "").toLowerCase().includes(searchTerm.toLowerCase())
            );
    //
    //include example
    //console.log(text.includes("World")); // true
    //console.log(text.includes("world")); // false เพราะตัว W กับ w ต่างกัน
    //
    //
    //
    //
    //
    //
    //
    //
    //
    ////////////////////////////////////////




  return (
    <>
     <Navbar />
    <div className="font-sans  flex items-center justify-center bg-gray-100 p-4">
      
     <div className="space-y-6 p-6 bg-gray-100 min-h-screen">
  {/* Charts Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* User Registrations */}
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">User Registrations</h2>

      <div className="mb-4">
        <label className="block font-medium text-gray-700 mb-2">Select Year:</label>
        <select
          value={selectedUserYear}
          onChange={e => SetSelectedUserYear(Number(e.target.value))}
          className="text-gray-800 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <Line data={user_register_data} />
      </div>
    </div>


    {/* Pet Creations */}
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Pet Creations</h2>

      <div className="mb-4">
        <label className="block font-medium text-gray-700 mb-2">Select Year:</label>
        <select
          value={selectedPetYear}
          onChange={e => SetSelectedPetYear(Number(e.target.value))}
          className="text-gray-800 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <Line data={pet_create_data} />
      </div>
    </div>




  



  </div>

  <div className="grid grid-cols-5 gap-6">

  {/*  Post (2 คอลัมน์) */}
  <div className="col-span-2 bg-white rounded-2xl shadow-md p-6 border border-gray-200 space-y-6 h-[600px]">
    
    {/* หัวข้อ + ฟิลเตอร์ */}
    <div className="flex  items-end">
      
      <h2 className="text-3xl font-bold text-gray-800">จัดการ Post</h2>

      <div className="items-center gap-2">
        <label className="font-semibold text-gray-700 ">
          Filter by Pet:
        </label>
        <select
          value={selectedPet || ""}
          onChange={(e) => setSelectedPet(e.target.value || null)}
          className="text-gray-800 w-48 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">All</option>
          {AllPet.map((pet) => (
            <option key={pet._id} value={pet.name}>
              {pet.name}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* Posts List */}
<div className="space-y-4 max-h-[460px] overflow-y-auto">
  {filteredPosts.length === 0 ? (
    <p className="text-gray-500 text-center">ยังไม่มีโพสต์</p>
  ) : (
    filteredPosts.map(post => (
      <div
        key={post._id}
        className="bg-gray-50 rounded-2xl shadow-sm p-4 flex flex-col gap-2 border border-gray-200 hover:shadow-md transition"
      >
        <p className="font-semibold text-gray-800">{post.owner.username}</p>
        <p className="text-gray-700">{post.PostDesc}</p>

        {post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {post.images.map((img, idx) => (
              <Image
                key={idx}
                src={`https://petfolioforportweb.onrender.com${img}`}
                alt={`post-${idx}`}
                className="w-full h-32 object-cover rounded-xl"
              />
            ))}
          </div>
        )}

        {post.pets.length > 0 && (
          <p className="text-gray-600 text-sm mt-2">
            สัตว์เลี้ยง: {post.pets.map(p => p.name).join(", ")}
          </p>
        )}

        <p className="text-gray-400 text-xs">{new Date(post.createdAt).toLocaleString()}</p>

        <div className="flex justify-end mt-2">
          <button
            onClick={() => handleDelete(post._id)}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-xl text-sm"
          >
            ลบ
          </button>
        </div>
      </div>
    ))
  )}
</div>

  </div>

  {/* จัดการผู้ใช้  */}
 <div className="col-span-3 bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex flex-col h-[600px]">
  {/* Header + Search */}
  <div className="flex justify-between items-center mb-4 flex-shrink-0">
    <h2 className="text-3xl font-bold text-gray-800">จัดการผู้ใช้</h2>
    <div className="max-w-md">
      <input
        type="text"
        placeholder="Search by username or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="text-gray-800 w-64 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  </div>

  {/* Table scrollable */}
  <div className="overflow-auto flex-1 border rounded-lg">
    <table className="w-full table-auto border-collapse text-left">
      <thead className="bg-gray-100 sticky top-0 z-10">
        <tr>
          <th className="text-gray-800 border px-4 py-2 text-center">Username</th>
          <th className="text-gray-800 border px-4 py-2 text-center">Email</th>
          <th className="text-gray-800 border px-4 py-2 text-center">Role</th>
          <th className="text-gray-800 border px-4 py-2 text-center">Status</th>
          <th className="text-gray-800 border px-4 py-2 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredUsers.map(user => (
          <tr key={user._id} className="hover:bg-gray-50 transition">
            <td className="text-gray-800 border px-4 py-2 ">{user.username}</td>
            <td className="text-gray-800 border px-4 py-2 ">{user.email}</td>
            <td className="text-gray-800 border px-4 py-2 text-center">{user.role}</td>
            <td className="text-gray-800 border px-4 py-2 text-center">
              {user.status === "active" ? (
                <span className="text-green-600 font-semibold">Active</span>
              ) : (
                <span className="text-red-600 font-semibold">Banned</span>
              )}
            </td>
            <td className="text-gray-800 border px-4 py-2 text-center">
              <button
                onClick={() => handleToggleStatus(user.userId)}
                className={`px-3 py-1 rounded text-white ${
                  user.status === "active"
                    ? "bg-red-500 hover:bg-red-600 rounded-xl"
                    : "bg-green-500 hover:bg-green-600 rounded-xl"
                }`}
              >
                {user.status === "active" ? "Ban" : "Unban"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

</div>


</div>
  </div>

    </>
  );
}
