import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Hyperspeed from "@/components/ui/Hyperspeed/Hyperspeed";
import { EventInsights } from "@/components/event-insights";

const LandingPage = () => {
  return (
    <>
      <Hyperspeed />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <h1>Landing</h1>
      </div>
    </>
  );
};

export default LandingPage;
