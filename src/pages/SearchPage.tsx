import SearchSection from "../components/SearchSection";
import { motion } from "motion/react";

export default function SearchPage() {
  return (
    <div className="pt-32 pb-24 min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-heading italic text-white mb-4">Find a Donor</h1>
          <p className="text-white/60 max-w-2xl mx-auto">Search our real-time database of registered blood donors in your area.</p>
        </motion.div>
        <SearchSection />
      </div>
    </div>
  );
}
