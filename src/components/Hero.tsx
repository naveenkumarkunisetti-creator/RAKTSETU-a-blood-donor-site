import { motion } from "motion/react";
import { ArrowUpRight, Play, Droplets, Search } from "lucide-react";
import BlurText from "./BlurText";
import { useState, useEffect } from "react";
import { db } from "@/src/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function Hero() {
  const [donorCount, setDonorCount] = useState<number | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.role !== "master";
      }).length;
      setDonorCount(count);
    });
    return () => unsubscribe();
  }, []);

  return (
    <section className="relative min-h-screen overflow-visible flex flex-col items-center justify-center px-8">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute left-0 w-full h-full object-cover opacity-60"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl w-full text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/5 border border-white/10 rounded-full px-1 py-1 mb-8 flex items-center gap-2 pr-4"
        >
          <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Droplets className="h-3 w-3 fill-white" />
            {donorCount !== null ? `${donorCount} Live` : "Loading..."}
          </span>
          <span className="text-white/90 text-xs font-body">
            Donors currently available in our network.
          </span>
        </motion.div>

        <BlurText
          text="The Gift of Life, Reimagined"
          className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.9] tracking-[-4px] mb-8"
        />

        <motion.p
          initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-lg md:text-xl text-white/70 font-body font-light leading-relaxed max-w-2xl mb-12"
        >
          A premium, AI-driven platform connecting donors and receivers with cinematic precision. 
          Choose your path below to start saving lives.
        </motion.p>

        <motion.div
          initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl"
        >
          <Link 
            to="/register"
            className="group relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-2xl p-8 flex flex-col items-start text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Droplets className="h-6 w-6 text-white fill-white" />
            </div>
            <h3 className="text-2xl font-heading italic text-white mb-2">Donor Register</h3>
            <p className="text-white/70 text-sm font-body mb-4">Register as a donor and help save lives in your community.</p>
            <div className="flex items-center gap-2 text-white font-medium mt-auto">
              Get Started <ArrowUpRight className="h-4 w-4" />
            </div>
          </Link>

          <Link 
            to="/search"
            className="group relative overflow-hidden bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl p-8 flex flex-col items-start text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-heading italic text-white mb-2">Blood Receiver</h3>
            <p className="text-white/70 text-sm font-body mb-4">Search for blood donors by group and location instantly.</p>
            <div className="flex items-center gap-2 text-white font-medium mt-auto">
              Find Donors <ArrowUpRight className="h-4 w-4" />
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
