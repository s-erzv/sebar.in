import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ============================================================
// TEMPLATE_SCHEMA 
// ============================================================
export const TEMPLATE_SCHEMA = {
  meta: {
    name: "Engagement Soft Botanical",
    category: "engagement",
    description: "Desain pertunangan yang lembut dengan animasi masuk yang elegan.",
    tags: ["botanical", "soft", "elegant", "floral", "clean"],
    color_palette: ["#FAF7F4", "#C9B8A8", "#A8B5A0", "#3D2B1F"],
    is_premium: false,
  },
  content_schema: {
    sections: [
      {
        id: "couple",
        label: "Data Pasangan",
        icon: "heart",
        fields: [
          { key: "person1_name", label: "Nama Pasangan 1", type: "text", required: true },
          { key: "person2_name", label: "Nama Pasangan 2", type: "text", required: true },
        ],
      },
      {
        id: "event",
        label: "Detail Acara",
        icon: "calendar",
        fields: [
          { key: "event_date", label: "Tanggal & Waktu", type: "datetime", required: true },
          { key: "venue", label: "Nama Tempat", type: "text", required: true },
          { key: "address", label: "Alamat Lengkap", type: "textarea", required: false },
        ],
      },
      {
        id: "message",
        label: "Pesan & Kutipan",
        icon: "quote",
        fields: [
          { key: "message", label: "Pesan Undangan", type: "textarea", required: false },
        ],
      }
    ]
  },
  // ============================================================
  // GUEST_SCHEMA: Konfigurasi field form saat nambah tamu
  // ============================================================
  guest_schema: {
    extra_fields: [
      { key: "table_number", label: "Nomor Meja", type: "text", required: false, placeholder: "Mawar-1" },
      { key: "session", label: "Sesi Kedatangan", type: "text", required: false, placeholder: "Sesi 1 (10:00)" },
    ]
  },
  default_content: {
    person1_name: "Raditya",
    person2_name: "Kinanti",
    event_date: "2026-10-20T10:00:00",
    venue: "Taman Kajoe",
    address: "Jl. Melati No. 12, Cilandak, Jakarta Selatan",
    message: "Dengan penuh kebahagiaan kami mengumumkan pertunangan kami dan mengundang kehadiran kalian.",
  }
};

// ============================================================
// COMPONENT
// ============================================================
export default function EngagementSoft({ content = {}, guest = {}, rsvp = {}, onRsvp }) {
  const [isOpened, setIsOpened] = useState(false);
  
  // 1. Fallback content logic
  const c = { ...TEMPLATE_SCHEMA.default_content, ...content };
  
  // 2. Ekstraksi Data Guest
  const guestName = guest?.name || "Tamu Kehormatan";
  const guestTable = guest?.custom_data?.table_number;
  const guestSession = guest?.custom_data?.session;

  const eventDate = c.event_date ? new Date(c.event_date) : new Date();

  return (
    <div className="min-h-screen bg-[#FAF7F4] text-[#3D2B1F] font-serif overflow-hidden">
      
      {/* ── SPLASH SCREEN / COVER ── */}
      <AnimatePresence>
        {!isOpened && (
          <motion.div
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-[#FAF7F4] flex flex-col items-center justify-center px-8 text-center"
          >
            {/* Dekorasi SVG */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="mb-8 opacity-40"
            >
              <svg viewBox="0 0 100 40" className="w-32">
                <path d="M10,30 Q30,10 50,20 Q70,30 90,10" stroke="#A8B5A0" strokeWidth="1" fill="none"/>
                <circle cx="50" cy="20" r="2" fill="#C9B8A8"/>
              </svg>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs tracking-[0.3em] text-[#B0A090] uppercase mb-6 font-sans">
              Pertunangan
            </motion.p>
            
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-5xl italic mb-2 text-[#3D2B1F]">
              {c.person1_name}
            </motion.h1>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl text-[#C9B8A8] my-2">💍</motion.div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-5xl italic mb-12 text-[#3D2B1F]">
              {c.person2_name}
            </motion.h1>

            {/* AREA DATA GUEST DI COVER */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.3 }}
              className="mb-10 bg-white/50 border border-[#E8D5C4] px-8 py-4 rounded-xl shadow-sm"
            >
              <p className="text-[10px] text-[#A8B5A0] uppercase tracking-widest font-sans mb-2">Kepada Yth.</p>
              <h2 className="text-xl font-medium mb-1">{guestName}</h2>
              
              {/* Conditional Rendering untuk Custom Data Guest */}
              {(guestTable || guestSession) && (
                <div className="flex gap-4 justify-center mt-3 pt-3 border-t border-[#E8D5C4]/50">
                  {guestTable && (
                    <span className="text-xs text-[#B0A090] font-sans">Meja: <strong className="text-[#3D2B1F]">{guestTable}</strong></span>
                  )}
                  {guestSession && (
                    <span className="text-xs text-[#B0A090] font-sans">Sesi: <strong className="text-[#3D2B1F]">{guestSession}</strong></span>
                  )}
                </div>
              )}
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsOpened(true)}
              className="px-8 py-3 bg-gradient-to-r from-[#C9B8A8] to-[#A8B5A0] text-white text-xs tracking-widest uppercase font-sans rounded-full shadow-md transition-shadow"
            >
              Buka Undangan
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      {isOpened && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="max-w-md mx-auto relative z-10"
        >
          {/* Top Border Dekoratif */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#C9B8A8] via-[#E8D5C4] to-[#A8B5A0]" />

          <main className="px-8 pt-16 pb-24 text-center">
            
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <p className="text-xs tracking-[0.2em] text-[#B0A090] uppercase font-sans mb-8">
                Bertunangan
              </p>
              <h1 className="text-6xl italic text-[#3D2B1F] mb-4">{c.person1_name}</h1>
              <div className="flex items-center justify-center gap-4 my-6">
                <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#C9B8A8]" />
                <span className="text-2xl">💍</span>
                <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#C9B8A8]" />
              </div>
              <h1 className="text-6xl italic text-[#3D2B1F]">{c.person2_name}</h1>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#FDF0EB] to-[#F5EDE8] border border-[#E8D5C4] rounded-2xl p-8 mb-16 shadow-sm"
            >
              <p className="text-[15px] italic text-[#6B5040] leading-relaxed">
                "{c.message}"
              </p>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <p className="text-[10px] tracking-[0.2em] text-[#B0A090] uppercase font-sans mb-8">
                Detail Acara
              </p>

              <div className="space-y-0 text-left border-y border-[#E8D5C4]">
                <div className="flex gap-4 p-5 border-b border-[#E8D5C4] bg-[#E8D5C4]/10">
                  <span className="text-xl shrink-0">🗓</span>
                  <div>
                    <p className="text-[10px] text-[#B0A090] font-sans uppercase tracking-widest mb-1">Hari & Tanggal</p>
                    <p className="text-sm font-medium">{format(eventDate, "EEEE, d MMMM yyyy", { locale: localeId })}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-5 border-b border-[#E8D5C4]">
                  <span className="text-xl shrink-0">🕐</span>
                  <div>
                    <p className="text-[10px] text-[#B0A090] font-sans uppercase tracking-widest mb-1">Pukul</p>
                    <p className="text-sm font-medium">{format(eventDate, "HH:mm")} WIB</p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 bg-[#E8D5C4]/10">
                  <span className="text-xl shrink-0">🌿</span>
                  <div>
                    <p className="text-[10px] text-[#B0A090] font-sans uppercase tracking-widest mb-1">Lokasi</p>
                    <p className="text-sm font-medium mb-1">{c.venue}</p>
                    <p className="text-xs text-gray-500">{c.address}</p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* RSVP Section */}
            {rsvp?.enabled && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <button
                  onClick={() => onRsvp?.("attending")}
                  className="w-full py-4 bg-gradient-to-r from-[#C9B8A8] to-[#A8B5A0] text-white font-sans text-xs tracking-widest uppercase rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  Konfirmasi Kehadiran
                </button>
              </motion.section>
            )}

          </main>
        </motion.div>
      )}
    </div>
  );
}