import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Clock, Droplets, Search as SearchIcon, MapPin, Phone, User as UserIcon, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, auth, handleFirestoreError, OperationType } from "@/src/firebase";
import { collection, onSnapshot, query, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Donor {
  id: string;
  name: string;
  bloodGroup: string;
  phone: string;
  age: number;
  location: string;
  healthIssues?: string;
  createdAt: any;
  role: string;
}

export default function SearchSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [bloodFilter, setBloodFilter] = useState("all");
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDonors = () => {
    setLoading(true);
    // Simplified query to avoid index issues and ensure we get all potential donors
    const q = query(collection(db, "users"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("SearchSection: Received snapshot with", snapshot.docs.length, "docs");
      const donorData = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          };
        })
        // Show everyone who is not a master
        .filter((d: any) => d.role !== "master")
        // Sort by creation date client-side
        .sort((a: any, b: any) => {
          const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0);
          const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0);
          return dateB - dateA;
        }) as Donor[];
      
      console.log("SearchSection: Total donors in list:", donorData.length);
      setDonors(donorData);
      setLoading(false);
    }, (error) => {
      console.error("Search query error:", error);
      handleFirestoreError(error, OperationType.LIST, "users");
      setLoading(false);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = fetchDonors();
    return () => unsubscribe();
  }, []);

  const filteredDonors = donors.filter((donor) => {
    // Blood filter
    const matchesBlood = bloodFilter === "all" || donor.bloodGroup === bloodFilter;
    
    // Location filter - be very flexible with matching
    const donorLoc = (donor.location || "").toLowerCase().trim();
    const searchLoc = locationTerm.toLowerCase().trim();
    const matchesLocation = donorLoc.includes(searchLoc) || searchLoc.includes(donorLoc);
    
    return matchesBlood && matchesLocation;
  });

  const hasSearch = locationTerm.trim().length >= 2;

  const handleCall = async (donor: Donor) => {
    try {
      await addDoc(collection(db, "callLogs"), {
        donorId: donor.id,
        donorName: donor.name,
        donorPhone: donor.phone,
        callerId: auth.currentUser?.uid || "anonymous",
        callerEmail: auth.currentUser?.email || "anonymous",
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging call:", error);
    }
  };

  return (
    <div className="bg-black relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading italic text-white mb-4">
            Find a Donor
          </h2>
          <p className="text-white/60 font-body font-light max-w-lg mx-auto mb-8">
            Search our real-time database for available donors. Filter by blood group and location to find the perfect match.
          </p>
          
          <div className="mb-12">
            <span className="text-white font-heading italic text-3xl">
              {donors.length}
            </span>
            <span className="text-white/40 font-body ml-2 uppercase tracking-widest text-sm">
              Donors Available Now
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="relative">
              <Select value={bloodFilter} onValueChange={setBloodFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-14 focus:ring-white/20">
                  <SelectValue placeholder="Blood Group" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  <SelectItem value="all">All Blood Groups</SelectItem>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 z-10" />
              <Input
                placeholder="Location (City/State)..."
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                className="bg-white/5 border-white/10 text-white rounded-xl h-14 pl-12 focus:ring-white/20"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchDonors()}
              className="text-white/40 hover:text-white flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {hasSearch && filteredDonors.map((donor, i) => (
              <motion.div
                key={donor.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="bg-transparent border border-white/20 h-full hover:border-white/50 transition-all duration-300 rounded-2xl group">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <Droplets className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-4xl font-heading italic text-white">
                        {donor.bloodGroup}
                      </div>
                    </div>

                    <h3 className="text-2xl font-heading italic text-white mb-6">
                      {donor.name}
                    </h3>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 text-white/80">
                        <UserIcon className="h-5 w-5 text-white/40" />
                        <span className="text-lg">{donor.age} years old</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/80">
                        <MapPin className="h-5 w-5 text-white/40" />
                        <span className="text-lg">{donor.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/80">
                        <Phone className="h-5 w-5 text-white/40" />
                        <span className="text-lg">{donor.phone}</span>
                      </div>
                    </div>

                    {donor.healthIssues && donor.healthIssues !== "None" ? (
                      <div className="flex items-start gap-3 text-white/50 text-sm mb-8 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-white/30" />
                        <p className="italic">"{donor.healthIssues}"</p>
                      </div>
                    ) : (
                      <div className="mb-8 p-4 rounded-xl border border-dashed border-white/5">
                        <p className="text-white/20 text-sm italic">No health issues reported</p>
                      </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-white/30 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>
                          Registered {donor.createdAt?.toDate ? donor.createdAt.toDate().toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                      
                      <a 
                        href={`tel:${donor.phone}`}
                        onClick={() => handleCall(donor)}
                        className="w-full flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/5"
                      >
                        <Phone className="h-5 w-5" />
                        Call Now
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!loading && hasSearch && filteredDonors.length === 0 && (
          <div className="text-center py-24 border border-white/10 rounded-3xl bg-white/5">
            <p className="text-white/40 font-body italic text-xl">No donors found in "{locationTerm}".</p>
            <p className="text-white/20 text-sm mt-2">Try searching for a broader area or check your spelling.</p>
          </div>
        )}

        {!hasSearch && (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl">
            <MapPin className="h-12 w-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 font-body italic text-xl">Enter at least 2 characters of a location to view donors.</p>
            <p className="text-white/20 text-sm mt-2">Example: "Vizianagaram" or "AP"</p>
          </div>
        )}
        
        {loading && donors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <RefreshCw className="h-8 w-8 text-white/20 animate-spin mb-4" />
            <p className="text-white/40">Loading donors...</p>
          </div>
        )}
      </div>
    </div>
  );
}
