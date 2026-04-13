import React, { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";
import { db, auth, handleFirestoreError, OperationType } from "@/src/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";

export default function RegistrationForm() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    location: "",
    bloodGroup: "",
    healthIssues: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bloodGroup) {
      toast.error("Please select a blood group.");
      return;
    }
    console.log("Registration process started...");
    
    setLoading(true);
    try {
      // Ensure we have a UID
      const uid = auth.currentUser?.uid || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const email = auth.currentUser?.email || formData.email;
      
      console.log("Target UID:", uid);
      
      const userRef = doc(db, "users", uid);
      
      // Prepare data
      const registrationData: any = {
        uid: uid,
        name: formData.name.trim(),
        email: email.trim(),
        phone: formData.phone.trim(),
        age: Number(formData.age),
        baseAge: Number(formData.age),
        location: formData.location.trim(),
        bloodGroup: formData.bloodGroup,
        healthIssues: formData.healthIssues.trim() || "None",
        role: "user",
        updatedAt: serverTimestamp(),
      };

      // Only set createdAt if it's a new registration (guest or first-time user)
      // For existing users, we'll check if they already have a createdAt
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists() || !userDoc.data()?.createdAt) {
        registrationData.createdAt = serverTimestamp();
      }

      // Use setDoc with merge: true
      await setDoc(userRef, registrationData, { merge: true });
      
      // Verify the write
      const verifyDoc = await getDoc(userRef);
      if (verifyDoc.exists()) {
        console.log("Firestore write verified:", verifyDoc.data());
      } else {
        throw new Error("Data verification failed after write.");
      }
      
      console.log("Firestore write successful");
      
      // Show success state
      setSuccess(true);
      toast.success("Registration Successful!");
      
      // Clear form
      setFormData({ name: "", email: "", phone: "", age: "", location: "", bloodGroup: "", healthIssues: "" });
      
      // Reset success state after 3 seconds as requested
      setTimeout(() => {
        setSuccess(false);
        // Redirect to search page to show their entry
        navigate("/search");
      }, 3000);

    } catch (error) {
      console.error("Registration critical error:", error);
      handleFirestoreError(error, OperationType.WRITE, "users");
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="py-24 px-8 bg-black relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-12 flex flex-col items-center gap-6"
          >
            <div className="h-20 w-20 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl font-heading italic text-white">Registration Complete!</h2>
            <p className="text-white/60">Thank you for joining our life-saving network. Your details are now live and visible to receivers in the section below.</p>
            <p className="text-white/40 text-sm font-medium animate-pulse">Redirecting to donor list...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black relative overflow-hidden">
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading italic text-white mb-4">
            Become a Life Saver
          </h2>
          <p className="text-white/60 font-body font-light max-w-lg mx-auto">
            Your contribution can save up to three lives. Register today and join our elite network of donors.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/70 ml-1">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl h-12 focus:ring-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70 ml-1">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  disabled={!!auth.currentUser}
                  value={auth.currentUser?.email || formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl h-12 focus:ring-white/20 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white/70 ml-1">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 890"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl h-12 focus:ring-white/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-white/70 ml-1">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  required
                  min="18"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl h-12 focus:ring-white/20"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location" className="text-white/70 ml-1">Location / Address</Label>
                <Input
                  id="location"
                  placeholder="City, State, Country"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl h-12 focus:ring-white/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodGroup" className="text-white/70 ml-1">Blood Group</Label>
              <Select
                required
                value={formData.bloodGroup}
                onValueChange={(val) => setFormData({ ...formData, bloodGroup: val })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-12 focus:ring-white/20">
                  <SelectValue placeholder="Select Blood Group" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="healthIssues" className="text-white/70 ml-1">
                Health Issues (Optional)
              </Label>
              <Textarea
                id="healthIssues"
                placeholder="Describe any health issues or skip if none..."
                value={formData.healthIssues}
                onChange={(e) => setFormData({ ...formData, healthIssues: e.target.value })}
                className="bg-white/5 border-white/10 text-white rounded-xl min-h-[120px] focus:ring-white/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-xl py-6 text-lg font-medium hover:scale-[1.02] transition-all"
            >
              {loading ? "Registering..." : "Complete Registration"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
