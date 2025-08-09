import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RPCDemo from "./components/RPCDemo.jsx";
import LamportRA from "./components/LamportRA.jsx";
import toast, { Toaster } from "react-hot-toast";

const Tab = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-2xl text-sm font-medium transition shadow-sm border
      ${active ? "bg-white border-slate-200" : "bg-slate-100 hover:bg-slate-200 border-transparent"}`}
  >
    {label}
  </button>
);

export default function App() {
  const [tab, setTab] = useState("rpc");

  useEffect(() => {
    toast.success("Welcome to DS Lab ✨");
  }, []);

  return (
    <div className="min-h-screen p-6 sm:p-10 bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight">Distributed Systems Lab</span>
          </div>
        </header>

        <nav className="flex gap-2">
          <Tab active={tab === "rpc"} label="RPC Demo" onClick={() => setTab("rpc")} />
          <Tab active={tab === "ra"} label="Lamport RA" onClick={() => setTab("ra")} />
        </nav>

        <main className="card p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {tab === "rpc" ? (
              <motion.div key="rpc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <RPCDemo />
              </motion.div>
            ) : (
              <motion.div key="ra" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <LamportRA />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}
