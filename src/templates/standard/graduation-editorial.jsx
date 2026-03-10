import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const TEMPLATE_SCHEMA = {
  meta: {
    name: "Graduation Editorial",
    category: "graduation",
    description: "Desain kelulusan elegan bergaya editorial majalah.",
    tags: ["editorial", "elegant", "magazine"],
    color_palette: ["#F8F4EE", "#1a1208", "#BF9B30", "#D4C5A9"],
    is_premium: false,
  },
  content_schema: {
    sections: [
      {
        id: "academic",
        label: "Data Kelulusan",
        icon: "academic-cap",
        fields: [
          { key: "name", label: "Nama Wisudawan", type: "text", required: true },
          { key: "degree", label: "Gelar Akademik", type: "text", required: true },
          { key: "university", label: "Universitas", type: "text", required: true },
          { key: "faculty", label: "Fakultas", type: "text", required: false },
        ],
      },
      {
        id: "event",
        label: "Acara & Pesan",
        icon: "calendar",
        fields: [
          { key: "event_date", label: "Tanggal & Waktu Acara", type: "datetime", required: true },
          { key: "venue", label: "Lokasi", type: "text", required: true },
          { key: "message", label: "Pesan/Quotes", type: "textarea", required: false },
        ],
      },
    ],
  },
  guest_schema: {
    extra_fields: [
      { key: "seat_number", label: "Nomor Kursi", type: "text", required: false },
    ],
  },
  default_content: {
    name: "Alexandria Putri",
    degree: "S.Kom.",
    university: "Universitas Indonesia",
    faculty: "Fakultas Ilmu Komputer",
    event_date: "2026-09-10T08:00:00",
    venue: "Balai Sidang Utama Kampus",
    message: "Dengan bangga kami mengundangmu merayakan momen bersejarah ini.",
  },
};

export default function GraduationEditorial({ content = {}, guest = {}, rsvp = {}, onRsvp }) {
  const [isOpened, setIsOpened] = useState(false);

  const c = { ...TEMPLATE_SCHEMA.default_content, ...content };
  const guestName = guest?.name || "Tamu Undangan";
  const seatNo = guest?.custom_data?.seat_number || "";
  const eventDate = c.event_date ? new Date(c.event_date) : new Date();

  return (
    <div className="min-h-screen bg-[#F8F4EE] text-[#1a1208] font-serif">
      {/* Decorative top bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#BF9B30] via-[#F0D060] to-[#BF9B30]" />

      <AnimatePresence>
        {!isOpened && (
          <motion.div
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 bg-[#F8F4EE] flex flex-col items-center justify-center p-8 text-center"
          >
            <p className="text-[10px] tracking-[0.4em] text-[#BF9B30] uppercase mb-6 font-sans">
              Class of {format(eventDate, "yyyy")}
            </p>
            <h1 className="text-4xl font-bold mb-4">{c.name}</h1>
            <p className="text-sm border border-[#BF9B30] text-[#BF9B30] px-4 py-1 mb-10 font-sans tracking-widest">
              {c.degree}
            </p>
            
            <div className="mb-12">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-sans">Kepada Yth.</p>
              <h2 className="text-xl font-bold">{guestName}</h2>
              {seatNo && <p className="text-xs text-[#BF9B30] mt-2 font-sans">Seat: {seatNo}</p>}
            </div>

            <button
              onClick={() => setIsOpened(true)}
              className="px-8 py-3 bg-[#1a1208] text-[#F8F4EE] text-xs uppercase tracking-[0.2em] font-sans hover:bg-[#BF9B30] transition-colors"
            >
              Buka Undangan
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpened && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto p-8 pb-24">
          <div className="text-center py-10 border-b border-[#D4C5A9] mb-10">
            <p className="text-[10px] tracking-[0.4em] text-[#BF9B30] uppercase mb-6 font-sans">— Wisuda —</p>
            <div className="text-6xl mb-4">🎓</div>
            <div className="w-16 h-px bg-[#BF9B30] mx-auto mt-6" />
          </div>

          <div className="text-center mb-10">
            <p className="text-xs text-gray-500 font-sans mb-2">Dengan bangga mempersembahkan</p>
            <h1 className="text-5xl font-black mb-4 leading-tight">{c.name}</h1>
            <span className="inline-block border border-[#BF9B30] text-[#BF9B30] px-6 py-1 text-xs tracking-[0.2em] font-sans">
              {c.degree}
            </span>
          </div>

          <div className="bg-[#1a1208] text-[#F8F4EE] p-8 mb-10 text-center">
            <p className="text-[10px] tracking-[0.3em] text-[#BF9B30] uppercase mb-2 font-sans">{c.university}</p>
            <p className="text-lg font-bold">{c.faculty}</p>
          </div>

          <div className="py-8 border-y border-[#D4C5A9] mb-10 text-center">
            <span className="text-4xl text-[#D4C5A9] leading-none">"</span>
            <p className="italic text-gray-700 leading-relaxed mt-2">{c.message}</p>
          </div>

          <div className="space-y-6 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 border border-[#D4C5A9] flex items-center justify-center shrink-0">📅</div>
              <div>
                <p className="text-[10px] text-gray-500 tracking-widest uppercase font-sans">Waktu</p>
                <p className="font-bold">{format(eventDate, "EEEE, d MMMM yyyy", { locale: localeId })}</p>
                <p className="text-sm text-gray-600">{format(eventDate, "HH:mm")} WIB</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 border border-[#D4C5A9] flex items-center justify-center shrink-0">📍</div>
              <div>
                <p className="text-[10px] text-gray-500 tracking-widest uppercase font-sans">Lokasi</p>
                <p className="font-bold">{c.venue}</p>
              </div>
            </div>
          </div>

          {rsvp?.enabled && (
            <button
              onClick={() => onRsvp?.("attending")}
              className="w-full py-4 border-2 border-[#1a1208] text-[#1a1208] font-bold text-xs tracking-[0.2em] uppercase font-sans hover:bg-[#1a1208] hover:text-[#F8F4EE] transition-colors"
            >
              Konfirmasi Kehadiran
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}