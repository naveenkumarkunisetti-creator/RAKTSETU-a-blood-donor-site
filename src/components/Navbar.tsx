import { motion } from "motion/react";
import { ArrowUpRight, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { auth } from "@/src/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [user] = useAuthState(auth);
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Register", href: "/register" },
    { name: "Search", href: "/search" },
    { name: "Master", href: "/master" },
  ];

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 px-8 lg:px-16 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-black font-heading italic text-xl">A</span>
          </div>
          <span className="text-white font-heading italic text-2xl hidden sm:block">Aura</span>
        </Link>

        {/* Center: Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 liquid-glass rounded-full px-1.5 py-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="px-4 py-2 text-sm font-medium text-foreground/90 font-body hover:text-white transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right: CTA / Mobile Menu */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 liquid-glass rounded-full px-4 py-2">
                <User className="h-4 w-4 text-white/60" />
                <span className="text-white text-sm font-body max-w-[100px] truncate">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => auth.signOut()}
                className="text-white/40 hover:text-white text-xs"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Link 
              to="/register"
              className="hidden sm:flex bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-white/20 transition-all group cursor-pointer items-center"
            >
              Register
              <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          )}

          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden text-white" />}>
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-black/95 border-white/10 text-white">
              <div className="flex flex-col gap-6 mt-12">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-2xl font-heading italic hover:text-white/70 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                {!user ? (
                  <Link 
                    to="/register"
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl mt-4 py-3 px-6 text-center font-medium cursor-pointer block"
                  >
                    Register
                  </Link>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => auth.signOut()}
                    className="bg-white/5 border-white/10 text-white rounded-xl mt-4 py-3 px-6 text-center font-medium cursor-pointer block w-full"
                  >
                    Logout
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
