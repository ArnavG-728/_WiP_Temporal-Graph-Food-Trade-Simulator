"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Globe, FlaskConical, CircleChevronRight, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Explorer", href: "/explorer", icon: Globe },
    { name: "Simulator", href: "/simulator", icon: FlaskConical },
    { name: "Insights", href: "/insights", icon: Terminal },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 glass-morphism rounded-full flex items-center gap-2 max-w-fit mx-auto">
            <div className="flex items-center gap-6 mr-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CircleChevronRight className="text-black w-5 h-5" />
                </div>
                <span className="font-display font-bold text-lg tracking-tight hidden md:block">
                    TEMPORAL<span className="text-emerald-500">FOOD</span>
                </span>
            </div>

            <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />

            <div className="flex items-center gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 group",
                                isActive ? "text-white" : "text-white/60 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "group-hover:text-emerald-300")} />
                            <span className="text-sm font-medium">{item.name}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="navbar-indicator"
                                    className="absolute inset-0 bg-emerald-500/10 rounded-full border border-emerald-500/20"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
