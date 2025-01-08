"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getAvailableRewards, getUserByEmail } from "@/utils/db/actions";
const inter = Inter({ subsets: ["latin"] });
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  //fecth the total reward
  useEffect(() => {
    const fetchTotalEarnings = async () => {
      const userEmail = localStorage.getItem("userEmail");
      if (userEmail) {
        try {
          const user = await getUserByEmail(userEmail);
          if (user) {
            const availableRewards :any = (await getAvailableRewards(
              user.id
            )) 
            setTotalEarnings(availableRewards);
          }
        } catch (error) {
          console.error("Error fetching total earning", error);
        }
      }
    };
    fetchTotalEarnings();
  }, []);
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray flex flex-col">
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            totalEarning={totalEarnings}
          />
          <div className="flex flex-1">
            <Sidebar open={sidebarOpen} />

            <main className="flex flex-1 p-4 lg-5 ml-0 lg:ml-64 transition-all">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
