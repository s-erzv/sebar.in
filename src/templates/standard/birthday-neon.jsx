import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const TEMPLATE_SCHEMA = {
  meta: {
    name: "Birthday Neon Glow",
    category: "birthday",
    description: "Template ulang tahun modern dengan efek neon dan confetti interaktif.",
    tags: ["neon", "party", "modern", "dark"],
    color_palette: ["#0a0a0f", "#FF6B6B", "#FFE66D", "#FF8BFF"],
    is_premium: false,
  },
  content_schema: {
    sections: [
      {
        id: "profile",
        label: "Data Ulang Tahun",
        icon: "user",
        fields: [
          { key: "name", label: "Nama Rayakan", type: "text", required: true },
          { key: "age", label: "Umur Ke-", type: "number", required: true },
        ],
      },
      {
        id: "event",
        label: "Acara",
        icon: "calendar",
        fields: [
          { key: "event_date", label: "Tanggal & Waktu", type: "datetime", required: true },
          { key: "venue", label: "Lokasi Acara", type: "text", required: true },
          { key: "message", label: "Pesan Undangan", type: "textarea", required: false },
        ],
      },
    ],
  },
  guest_schema: {
    extra_fields: [
      { key: "table_number", label: "Nomor Meja", type: "text", required: false },
    ],
  },
  default_content: {
    name: "Alexandria",
    age: 17,
    event_date: "2026-08-15T19:00:00",
    venue: "Glow In The Dark Cafe, Sudirman",
    message: "Let's light up the night and celebrate my special day together!",
  },
};

export default function BirthdayNeon({ content = {}, guest = {}, rsvp = {}, onRsvp }) {
  const [isOpened, setIsOpened] = useState(false);
  const canvasRef = useRef(null);

  const c = { ...TEMPLATE_SCHEMA.default_content, ...content };
  const guestName = guest?.name || "Tamu Undangan";
  const tableNo = guest?.custom_data?.table_number || "";
  const eventDate = c.event_date ? new Date(c.event_date) : new Date();

  // Confetti Logic
  useEffect(() => {
    if (!isOpened || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width, height, pieces = [], animationId;

    const init = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      pieces = Array.from({ length: 60 }, () => ({
        x: Math.random() * width, y: Math.random() * height - height,
        r: Math.random() * 5 + 2, d: Math.random() * 3 + 2,
        color: ["#FF6B6B", "#FFE66D", "#4ECDC4", "#FF8BFF"][Math.floor(Math.random() * 4)],
        tilt: Math.random() * 10
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      pieces.forEach(p => {
        p.y += p.d;
        if (p.y > height) { p.y = -10; p.x = Math.random() * width; }
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };

    init(); draw();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", init); };
  }, [isOpened]);

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans overflow-hidden">
      
      {/* COVER / SPLASH */}
      <AnimatePresence>
        {!isOpened && (
          <motion.div
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 bg-[#050508] flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
              <p className="text-xs text-[#4ECDC4] tracking-[0.3em] uppercase mb-4">You're Invited</p>
              <h1 className="text-5xl font-black bg-gradient-to-r from-[#FF6B6B] to-[#FF8BFF] bg-clip-text text-transparent">
                {c.name}'s Party
              </h1>
            </motion.div>
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-12">
              <p className="text-sm text-gray-500 mb-2">FOR</p>
              <h2 className="text-2xl font-bold">{guestName}</h2>
              {tableNo && <p className="text-xs text-[#FFE66D] mt-2 border border-[#FFE66D]/30 px-3 py-1 rounded-full inline-block">Table {tableNo}</p>}
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpened(true)}
              className="px-8 py-4 bg-gradient-to-r from-[#FF6B6B] to-[#FF8BFF] text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(255,107,107,0.4)]"
            >
              LETS PARTY 🎉
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      {isOpened && (
        <>
          <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-60" />
          
          {/* Neon Glow Blobs */}
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#FF6B6B] blur-[120px] opacity-20" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-[#4ECDC4] blur-[100px] opacity-20" />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-md mx-auto h-screen overflow-y-auto p-6 pb-24">
            
            <div className="text-center mt-12 mb-16">
              <div className="text-6xl mb-4">🎂</div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-[#FF6B6B] via-[#FFE66D] to-[#FF8BFF] bg-clip-text text-transparent mb-4">
                {c.name}
              </h1>
              <span className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8BFF] text-white font-bold px-6 py-2 rounded-full text-lg shadow-lg">
                TURNING {c.age}!
              </span>
            </div>

            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Date</p>
                  <p className="font-bold">{format(eventDate, "EEEE, d MMMM yyyy", { locale: localeId })}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Time</p>
                  <p className="font-bold">{format(eventDate, "HH:mm")} WIB</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Venue</p>
                  <p className="font-bold text-sm">{c.venue}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#FFE66D]/10 border border-[#FFE66D]/20 rounded-2xl p-6 text-center mb-10">
              <p className="text-[#FFE66D] italic">"{c.message}"</p>
            </div>

            {rsvp?.enabled && (
              <button
                onClick={() => onRsvp?.("attending")}
                className="w-full py-4 rounded-2xl font-bold bg-white text-black transition hover:scale-[1.02]"
              >
                RSVP NOW 🎊
              </button>
            )}

          </motion.div>
        </>
      )}
    </div>
  );
}