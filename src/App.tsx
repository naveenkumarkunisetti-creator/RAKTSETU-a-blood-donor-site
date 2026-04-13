/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Toaster } from "@/components/ui/sonner";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import MasterPage from "./pages/MasterPage";
import { useEffect } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

export default function App() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          const email = user.email?.toLowerCase();
          const isMaster = email === "naveenkumarkunisetti@gmail.com" || email === "naveenkumarkunisetti@gamil.com";
          
          await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || "Anonymous User",
            email: user.email,
            phone: "Not Provided",
            age: 18,
            baseAge: 18,
            location: "Not Provided",
            role: isMaster ? "master" : "user",
            bloodGroup: "Unknown",
            createdAt: serverTimestamp(),
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="bg-black min-h-screen selection:bg-white selection:text-black">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/master" element={<MasterPage />} />
        </Routes>
        
        <footer className="py-12 px-8 border-t border-white/5 bg-black">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-heading italic text-sm">A</span>
              </div>
              <span className="text-white font-heading italic text-xl">Aura</span>
            </div>
            <p className="text-white/40 text-xs font-body">
              © 2026 Aura Blood Link. All rights reserved. Designed for life.
            </p>
            <div className="flex gap-6">
              {["Privacy", "Terms", "Contact"].map((item) => (
                <a key={item} href="#" className="text-white/40 text-xs hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </footer>

        <Toaster position="bottom-right" theme="dark" />
      </div>
    </Router>
  );
}
