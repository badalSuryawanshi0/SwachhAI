"use client";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Poppins } from "next/font/google";
import WasteSegregationAnimation from "@/components/Animtedlogo";
import Link from "next/link";
const poppins = Poppins({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
  display: "swap",
});
export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    const user = async () => {
      const user = localStorage.getItem("userEmail");
      if (user) {
        setLoggedIn(true);
      }
    };
    user();
  }, []);

  return (
    <div className={`container mx-auto px-4 py-16 ${poppins.className}`}>
      <section className="text-center mb-20">
        <WasteSegregationAnimation />
        <h1 className="text-6xl font-bold mb-6 text-gray-800 tracking-tight">
          Welcome <span className="text-green-600">Swaach Bharat</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
          "Transforming India, One Step at a Time. Join Swachh Bharat App in
          revolutionizing waste management for a cleaner, greener future!"
        </p>
        {!loggedIn ? (
          <Button className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Link href='/report'>
            <Button className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
              Report Waste
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        )}
      </section>
    </div>
  );
}
