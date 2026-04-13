import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Trash2, Edit3, CheckCircle, XCircle, Mail, Lock, Key, ArrowRight, Phone, BarChart3, PieChart as PieChartIcon, Activity, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, auth, handleFirestoreError, OperationType } from "@/src/firebase";
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, getDoc, setDoc, serverTimestamp, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  location: string;
  bloodGroup: string;
  healthIssues?: string;
  role: string;
  baseAge?: number;
  createdAt: any;
}

interface CallLog {
  id: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  callerId: string;
  callerEmail: string;
  timestamp: any;
}

export default function MasterDashboard() {
  const [isMaster, setIsMaster] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "calls" | "stats">("users");
  const [loginData, setLoginData] = useState({ 
    email: "naveenkumarkunisetti@gmail.com", 
    password: "" 
  });
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Check if current user is master
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setAuthError(null);
      if (user) {
        const email = user.email?.toLowerCase();
        console.log("Auth state changed. User:", email);
        
        // Immediate check for hardcoded master emails
        if (email === "naveenkumarkunisetti@gmail.com" || email === "naveenkumarkunisetti@gamil.com") {
          console.log("Hardcoded master email detected.");
          setIsMaster(true);
          
          // Sync role in background
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists() || userDoc.data().role !== "master") {
              await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: "Master Admin",
                email: user.email,
                role: "master",
                bloodGroup: "ADMIN",
                phone: "0000000000",
                age: 99,
                location: "System",
                createdAt: serverTimestamp()
              }, { merge: true });
            }
          } catch (e) {
            console.error("Background role sync failed:", e);
          }
        } else {
          // Check database for other master accounts
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role === "master") {
              setIsMaster(true);
            } else {
              setIsMaster(false);
            }
          } catch (e: any) {
            console.error("Database master check failed:", e);
            setAuthError("Could not verify master status from database.");
          }
        }
      } else {
        setIsMaster(false);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch all users and call logs if master
  useEffect(() => {
    if (!isMaster) return;

    const qUsers = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const userData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserData[];
      setUsers(userData);
    });

    const qCalls = query(collection(db, "callLogs"));
    const unsubscribeCalls = onSnapshot(qCalls, (snapshot) => {
      const callData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CallLog[];
      // Sort by timestamp descending
      callData.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return timeB - timeA;
      });
      setCallLogs(callData);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeCalls();
    };
  }, [isMaster]);

  // Auto-update ages based on registration anniversary
  useEffect(() => {
    if (!isMaster || users.length === 0) return;

    const syncAges = async () => {
      const now = Date.now();
      const oneYearMs = 1000 * 60 * 60 * 24 * 365.25;
      let updateCount = 0;

      for (const user of users) {
        if (!user.createdAt?.toMillis) continue;

        const registrationTime = user.createdAt.toMillis();
        const yearsPassed = Math.floor((now - registrationTime) / oneYearMs);
        
        // Use baseAge if available, otherwise assume current age is baseAge
        const baseAge = user.baseAge || user.age;
        const targetAge = baseAge + yearsPassed;

        if (user.age !== targetAge) {
          try {
            await updateDoc(doc(db, "users", user.id), { 
              age: targetAge,
              baseAge: baseAge, // Ensure baseAge is saved for future syncs
              updatedAt: serverTimestamp() 
            });
            updateCount++;
          } catch (e) {
            console.error(`Failed to update age for user ${user.id}:`, e);
          }
        }
      }

      if (updateCount > 0) {
        toast.info(`Automatically updated ages for ${updateCount} users based on registration anniversary.`);
      }
    };

    // Run once when users are loaded
    syncAges();
  }, [isMaster, users.length]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = loginData.email.trim().toLowerCase();
    const password = loginData.password.trim();

    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    // Hardcoded check for master credentials to ensure they are the "primary key"
    const isMasterCreds = (email === "naveenkumarkunisetti@gmail.com" || email === "naveenkumarkunisetti@gamil.com") && password === "Naveen@12345";

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success("Master Access Granted.");
      
      // Force immediate check
      const user = userCredential.user;
      if (user.email?.toLowerCase() === "naveenkumarkunisetti@gmail.com" || user.email?.toLowerCase() === "naveenkumarkunisetti@gamil.com") {
        setIsMaster(true);
      }
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);
      
      // If it's the master but account doesn't exist yet, bootstrap it
      if (isMasterCreds && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials')) {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          toast.success("Master account initialized and logged in.");
        } catch (createError: any) {
          toast.error("Critical Error: Could not initialize master account. " + createError.message);
        }
      } else if (error.code === 'auth/wrong-password') {
        toast.error("Incorrect password. Please use the default: Naveen@12345");
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error("Password login is disabled in Firebase. Please use 'Sign in with Google' below or enable Email/Password in Firebase Console.");
      } else {
        toast.error(`Login failed: ${error.message}`);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!loginData.email) {
      toast.error("Please enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginData.email);
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (error: any) {
      toast.error("Failed to send reset email. " + error.message);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      toast.success("Record deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  };

  const handleToggleRole = async (user: UserData) => {
    const newRole = user.role === "master" ? "user" : "master";
    try {
      await updateDoc(doc(db, "users", user.id), { role: newRole });
      toast.success(`User role updated to ${newRole}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const { id, ...data } = editingUser;
      await updateDoc(doc(db, "users", id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      toast.success("User updated successfully.");
      setEditingUser(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  if (!isMaster) {
    return (
      <div className="py-24 px-8 bg-black min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-12 max-w-md w-full text-center"
        >
          <div className="space-y-8">
            <Shield className="h-16 w-16 text-white/20 mx-auto" />
            <h2 className="text-3xl font-heading italic text-white">Master Access</h2>
            <p className="text-white/40 text-sm">Please enter the master credentials to continue.</p>
            
            <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-white/60 text-xs text-center leading-relaxed">
                <span className="text-white font-bold">Tip:</span> Use <span className="text-white italic">Sign in with Google</span> for the fastest and most secure Master access.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2 text-left">
                <Label className="text-white/50 ml-1">Master Email</Label>
                <Input
                  type="email"
                  placeholder="naveenkumarkunisetti@gmail.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl h-12"
                />
              </div>
              <div className="space-y-2 text-left">
                <Label className="text-white/50 ml-1">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-xl py-6">
                Authenticate with Password
              </Button>
            </form>

            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-4 text-white/40 font-bold tracking-widest">Recommended Method</span>
              </div>
            </div>

            <Button 
              onClick={async () => {
                try {
                  const provider = new GoogleAuthProvider();
                  const result = await signInWithPopup(auth, provider);
                  if (result.user.email?.toLowerCase() === "naveenkumarkunisetti@gmail.com" || result.user.email?.toLowerCase() === "naveenkumarkunisetti@gamil.com") {
                    setIsMaster(true);
                  }
                  toast.success("Authenticated via Google.");
                } catch (error: any) {
                  toast.error("Google authentication failed: " + error.message);
                }
              }}
              className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl py-8 flex items-center justify-center gap-3 text-lg font-bold shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02]"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google (Instant Access)
            </Button>

            <div className="pt-4 text-center space-y-2">
              <button 
                onClick={handleForgotPassword}
                className="text-white/20 hover:text-white/40 text-xs transition-colors block w-full"
              >
                Forgot Master Password?
              </button>
              <p className="text-white/10 text-[10px] uppercase tracking-tighter">
                Default Password: Naveen@12345
              </p>
            </div>

            {auth.currentUser && (
              <div className="pt-4 space-y-4">
                {(auth.currentUser.email?.toLowerCase() === "naveenkumarkunisetti@gmail.com" || 
                  auth.currentUser.email?.toLowerCase() === "naveenkumarkunisetti@gamil.com") && !isMaster && (
                  <Button 
                    onClick={() => setIsMaster(true)}
                    className="w-full bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/30 rounded-xl py-4"
                  >
                    Force Master Access
                  </Button>
                )}
                <button 
                  onClick={() => auth.signOut()}
                  className="text-white/20 hover:text-white/40 text-xs transition-colors block w-full text-center"
                >
                  Logout of {auth.currentUser.email}
                </button>
              </div>
            )}
          </div>

          <p className="mt-8 text-white/30 text-xs font-body">
            Only authorized personnel can access the master dashboard.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-24 px-8 bg-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <h2 className="text-5xl md:text-6xl font-heading italic text-white">
              System Control
            </h2>
            <div className="flex gap-4 mt-8 flex-wrap">
              <button 
                onClick={() => setActiveTab("users")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                Registered Donors ({users.length})
              </button>
              <button 
                onClick={() => setActiveTab("calls")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'calls' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                Call Logs ({callLogs.length})
              </button>
              <button 
                onClick={() => setActiveTab("stats")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'stats' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                <Activity className="h-4 w-4" /> Analytics
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-white font-body font-medium">{auth.currentUser?.email}</p>
              <p className="text-white/40 text-xs uppercase tracking-widest">Master Administrator</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => auth.signOut()}
              className="rounded-full border-white/10 text-white hover:bg-white/5"
            >
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {activeTab === "users" ? (
            users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-6">
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center text-2xl font-heading italic ${user.role === 'master' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
                    {user.bloodGroup}
                  </div>
                  <div>
                    <h3 className="text-xl font-body font-medium text-white flex items-center gap-2">
                      {user.name}
                      {user.role === 'master' && <Shield className="h-4 w-4 text-white/50" />}
                    </h3>
                    <p className="text-white/40 text-sm font-body">{user.email}</p>
                  </div>
                </div>

                <div className="flex-1 max-w-md">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                    <span className="text-white/60 text-xs font-body">Age: {user.age}</span>
                    <span className="text-white/60 text-xs font-body">Loc: {user.location}</span>
                    <span className="text-white/60 text-xs font-body">Tel: {user.phone}</span>
                  </div>
                  <p className="text-white/60 text-sm italic">
                    {user.healthIssues || "No health issues reported"}
                  </p>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest mt-2">
                    Registered: {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleString() : 'Recently'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end mr-2">
                    <span className="text-[10px] text-white/20 uppercase font-bold">Actions</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleRole(user)}
                        className="text-white/40 hover:text-white hover:bg-white/5 h-8 w-8"
                        title={user.role === 'master' ? "Demote to User" : "Promote to Master"}
                      >
                        {user.role === 'master' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingUser(user)}
                        className="text-white/40 hover:text-white hover:bg-white/5 h-8 w-8"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl px-4 flex items-center gap-2 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Remove Fake</span>
                  </Button>
                </div>
              </motion.div>
            ))
          ) : activeTab === "calls" ? (
            callLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-6">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-white/60" />
                  </div>
                  <div>
                    <h3 className="text-lg font-body font-medium text-white">
                      Call to {log.donorName}
                    </h3>
                    <p className="text-white/40 text-sm font-body">Donor Phone: {log.donorPhone}</p>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-white/60 text-sm">
                    Caller: <span className="text-white">{log.callerEmail}</span>
                  </p>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest mt-1">
                    Time: {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Recently'}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Blood Group Distribution */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8"
              >
                <div className="flex items-center gap-3 mb-8">
                  <PieChartIcon className="h-6 w-6 text-white/60" />
                  <h3 className="text-xl font-heading italic text-white">Blood Group Distribution</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(users.reduce((acc, user) => {
                          acc[user.bloodGroup] = (acc[user.bloodGroup] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.entries(users.reduce((acc, user) => {
                          acc[user.bloodGroup] = (acc[user.bloodGroup] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Registration Timeline */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8"
              >
                <div className="flex items-center gap-3 mb-8">
                  <BarChart3 className="h-6 w-6 text-white/60" />
                  <h3 className="text-xl font-heading italic text-white">Registration Timeline</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(users.reduce((acc, user) => {
                      const date = user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'Recent';
                      acc[date] = (acc[date] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)).map(([date, count]) => ({ date, count })).slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Summary Metrics */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Total Donors</p>
                  <p className="text-4xl font-heading italic text-white">{users.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Total Calls Logged</p>
                  <p className="text-4xl font-heading italic text-white">{callLogs.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Recent Activity (24h)</p>
                  <p className="text-4xl font-heading italic text-white">
                    {users.filter(u => u.createdAt?.toDate && (Date.now() - u.createdAt.toDate().getTime() < 86400000)).length}
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        <AnimatePresence>
          {editingUser && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full"
              >
                <h3 className="text-2xl font-heading italic text-white mb-6">Edit User Details</h3>
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-white/50 text-xs">Name</Label>
                      <Input 
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                        className="bg-white/5 border-white/10 text-white h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/50 text-xs">Phone</Label>
                      <Input 
                        value={editingUser.phone}
                        onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                        className="bg-white/5 border-white/10 text-white h-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-white/50 text-xs">Age</Label>
                      <Input 
                        type="number"
                        value={editingUser.age}
                        onChange={(e) => setEditingUser({...editingUser, age: Number(e.target.value)})}
                        className="bg-white/5 border-white/10 text-white h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/50 text-xs">Blood Group</Label>
                      <Input 
                        value={editingUser.bloodGroup}
                        onChange={(e) => setEditingUser({...editingUser, bloodGroup: e.target.value})}
                        className="bg-white/5 border-white/10 text-white h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/50 text-xs">Location</Label>
                    <Input 
                      value={editingUser.location}
                      onChange={(e) => setEditingUser({...editingUser, location: e.target.value})}
                      className="bg-white/5 border-white/10 text-white h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/50 text-xs">Health Issues</Label>
                    <Input 
                      value={editingUser.healthIssues || ""}
                      onChange={(e) => setEditingUser({...editingUser, healthIssues: e.target.value})}
                      className="bg-white/5 border-white/10 text-white h-10"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setEditingUser(null)} className="flex-1 text-white/40 hover:text-white">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-white/10 hover:bg-white/20 text-white">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>;
}
