import RegistrationForm from "../components/RegistrationForm";
import { motion } from "motion/react";

export default function RegisterPage() {
  return (
    <div className="pt-32 pb-24 min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-heading italic text-white mb-4">Donor Registration</h1>
          <p className="text-white/60 max-w-2xl mx-auto">Join our network of life-savers. Your contribution can save up to three lives.</p>
        </motion.div>
        <RegistrationForm />
      </div>
    </div>
  );
}
