import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ============================================================
// TEMPLATE_SCHEMA
// ============================================================
export const TEMPLATE_SCHEMA = {
  meta: {
    name: "Premium Eid Envelope",
    category: "general", // Sesuai constraint database: wedding | birthday | graduation | engagement | general
    description: "Kartu ucapan Idul Fitri interaktif dengan animasi amplop 3D, musik, dan undangan Open House.",
    tags: ["eid", "ramadan", "islamic", "envelope", "premium", "gold", "green"],
    color_palette: ["#0B2419", "#113A28", "#D4AF37", "#F0E8D8"],
    is_premium: true,
  },

  content_schema: {
    sections: [
      {
        id: "family",
        label: "Data Keluarga",
        icon: "users",
        fields: [
          { key: "family_name", label: "Nama Keluarga", type: "text", required: true, placeholder: "Keluarga Bp. Ahmad" },
          { key: "family_photo", label: "Foto Keluarga", type: "image", required: false, aspect_ratio: "4:3" },
        ],
      },
      {
        id: "greeting",
        label: "Ucapan",
        icon: "message",
        fields: [
          { key: "hijri_year", label: "Tahun Hijriah", type: "text", required: true, placeholder: "1447 H" },
          { key: "greeting_title", label: "Judul Ucapan", type: "text", required: true, placeholder: "Selamat Hari Raya Idul Fitri" },
          { key: "message", label: "Pesan/Doa", type: "textarea", required: false },
        ],
      },
      {
        id: "open_house",
        label: "Open House (Opsional)",
        icon: "home",
        fields: [
          { key: "event_date", label: "Tanggal & Waktu", type: "datetime", required: false },
          { key: "venue", label: "Tempat / Kediaman", type: "text", required: false, placeholder: "Kediaman Kami" },
          { key: "address", label: "Alamat Lengkap", type: "textarea", required: false },
        ],
      },
      {
        id: "media",
        label: "Musik & Latar",
        icon: "music",
        fields: [
          { key: "music_url", label: "Upload Musik Latar", type: "audio", required: false, accept: ".mp3" },
        ],
      },
    ],
  },

  guest_schema: {
    extra_fields: [
      { key: "session", label: "Sesi Silaturahmi", type: "text", required: false, placeholder: "Hari Pertama (Pagi)" },
    ],
  },

  default_content: {
    family_name: "Keluarga Bp. H. Ahmad Fauzi",
    family_photo: null,
    hijri_year: "1447 H",
    greeting_title: "Selamat Hari Raya Idul Fitri",
    message: "Taqabbalallahu minna wa minkum. Minal 'Aidin wal-Faizin. Mohon maaf lahir dan batin atas segala khilaf dan salah.",
    event_date: "2026-03-20T10:00:00",
    venue: "Kediaman Keluarga Besar",
    address: "Jl. Zamrud Khatulistiwa No. 99, Jakarta Selatan",
    music_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
};

// ============================================================
// COMPONENT
// ============================================================
export default function EidEnvelopeMagic({ content = {}, guest = {}, rsvp = {}, onRsvp }) {
  // State animasi: 0=idle, 1=flap buka, 2=kartu naik, 3=amplop turun, 4=main content
  const [envelopeState, setEnvelopeState] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Fallback data
  const c = { ...TEMPLATE_SCHEMA.default_content, ...content };
  const guestName = guest?.name || "Keluarga & Sahabat";
  const session = guest?.custom_data?.session || "";
  const eventDate = c.event_date ? new Date(c.event_date) : null;

  // Handler Buka Amplop Berurutan (Mencegah Race Condition)
  const handleOpenEnvelope = () => {
    // 1. Play Audio (Aman dari block browser karena ditrigger onClick)
    if (audioRef.current && c.music_url) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log("Audio Error:", e));
    }
    
    // 2. Sequence Animasi
    setEnvelopeState(1);
    setTimeout(() => setEnvelopeState(2), 800);
    setTimeout(() => setEnvelopeState(3), 1600);
    setTimeout(() => setEnvelopeState(4), 2200);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-[#071710] text-[#F0E8D8] font-serif overflow-hidden relative">
      {/* ── AUDIO INJECTION ── */}
      {c.music_url && <audio ref={audioRef} src={c.music_url} loop preload="auto" />}

      {/* ── FLOATING MUSIC CONTROLLER ── */}
      <AnimatePresence>
        {envelopeState === 4 && c.music_url && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={toggleMusic}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full border border-[#D4AF37] bg-[#0B2419]/80 backdrop-blur-md flex items-center justify-center text-[#D4AF37] shadow-lg shadow-black/50"
          >
            {isPlaying ? "⏸" : "▶"}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── SPLASH SCREEN (ENVELOPE 3D CSS) ── */}
      <AnimatePresence>
        {envelopeState < 4 && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#071710] p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#113A28] to-[#071710]"
          >
            {/* Sapaan Luar */}
            <motion.div 
              animate={envelopeState >= 3 ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
              className="mb-12 text-center"
            >
              <p className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-3 font-sans">Pesan Silaturahmi Untuk</p>
              <h2 className="text-2xl font-medium text-[#F0E8D8]">{guestName}</h2>
            </motion.div>

            {/* Konstruksi Amplop 3D */}
            <motion.div 
              animate={envelopeState === 3 ? { y: 250, opacity: 0, scale: 0.9 } : { y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="relative w-full max-w-sm aspect-[4/3] drop-shadow-2xl"
            >
              {/* 1. Back Envelope (Bagian Dalam/Belakang) */}
              <div className="absolute inset-0 bg-[#0B2419] rounded-lg border border-[#D4AF37]/20" />

              {/* 2. Kartu Undangan (The Card) */}
              <motion.div
                initial={{ y: 0, zIndex: 10 }}
                animate={envelopeState >= 2 ? { y: -140, zIndex: 30 } : { y: 0, zIndex: 10 }}
                transition={{ duration: 0.8, ease: "backOut" }}
                className="absolute inset-3 bg-[#F0E8D8] rounded-md shadow-inner flex flex-col items-center justify-center p-6 text-center border-2 border-[#D4AF37]"
              >
                <svg viewBox="0 0 24 24" className="w-12 h-12 mb-2 fill-[#113A28]">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  {/* Ornamen sederhana bintang/bulan sabit bisa ditaruh di sini */}
                  <path d="M12,4A8,8,0,1,0,20,12,8.009,8.009,0,0,0,12,4Zm0,14a6,6,0,1,1,6-6A6.007,6.007,0,0,1,12,18Z"/>
                </svg>
                <h1 className="text-xl text-[#113A28] font-bold mb-1">{c.hijri_year}</h1>
                <p className="text-[10px] text-[#0B2419] uppercase tracking-widest font-sans font-semibold">Idul Fitri</p>
              </motion.div>

              {/* 3. Saku Depan (Front Pocket) */}
              <div 
                className="absolute inset-0 z-20 rounded-lg pointer-events-none bg-[#113A28] border-b border-x border-[#D4AF37]/30"
                style={{ clipPath: "polygon(0 0, 50% 45%, 100% 0, 100% 100%, 0 100%)" }} 
              />
              <div 
                className="absolute inset-0 z-20 rounded-lg pointer-events-none"
                style={{ 
                  background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)",
                  clipPath: "polygon(0 0, 50% 45%, 100% 0, 100% 100%, 0 100%)"
                }} 
              />

              {/* 4. Flap Penutup Atas */}
              <motion.div
                initial={{ rotateX: 0 }}
                animate={envelopeState >= 1 ? { rotateX: 180, zIndex: 5 } : { rotateX: 0, zIndex: 25 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ transformOrigin: "top" }}
                className="absolute top-0 left-0 w-full h-[60%] rounded-t-lg"
              >
                 <div 
                    className="w-full h-full border-t border-[#D4AF37]/50"
                    style={{ 
                      backgroundColor: envelopeState >= 1 ? "#0A1F15" : "#113A28", 
                      clipPath: "polygon(0 0, 100% 0, 50% 100%)"
                    }} 
                 />
                 <div 
                    className="absolute inset-0"
                    style={{ 
                      background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)",
                      clipPath: "polygon(0 0, 100% 0, 50% 100%)"
                    }} 
                 />
              </motion.div>

              {/* 5. Tombol Wax Seal */}
              {envelopeState === 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenEnvelope}
                  className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#9A7B2C] rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.5)] flex items-center justify-center text-[#071710] border-2 border-[#F0E8D8]/50"
                >
                  <span className="text-[10px] tracking-widest font-bold uppercase font-sans">Buka</span>
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT (KARTU UCAPAN) ── */}
      {envelopeState === 4 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="max-w-md mx-auto relative z-10"
        >
          {/* Header Image / Photo */}
          <section className="pt-12 px-6 flex flex-col items-center text-center">
            {c.family_photo ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                src={c.family_photo}
                alt="Keluarga"
                className="w-full aspect-[4/3] object-cover rounded-t-full rounded-b-xl shadow-2xl border-4 border-[#D4AF37]/20 mb-8"
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full aspect-[4/3] bg-[#113A28] rounded-t-full rounded-b-xl border-4 border-[#D4AF37]/20 flex items-center justify-center mb-8"
              >
                <div className="text-[#D4AF37] text-6xl opacity-50">🕌</div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <p className="text-[10px] tracking-[0.4em] text-[#D4AF37] uppercase mb-4 font-sans">
                {c.hijri_year}
              </p>
              <h1 className="text-4xl font-bold mb-4 leading-tight text-[#D4AF37]">
                {c.greeting_title}
              </h1>
              <p className="text-lg text-[#F0E8D8] mb-8">
                {c.family_name}
              </p>

              <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-8" />
              
              <p className="text-sm text-gray-300 italic leading-loose px-4 mb-12">
                "{c.message}"
              </p>
            </motion.div>
          </section>

          {/* Guest Personalization */}
          <motion.section 
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="px-6 mb-12"
          >
            <div className="bg-[#113A28]/50 border border-[#D4AF37]/30 p-6 rounded-2xl text-center backdrop-blur-sm">
              <p className="text-[10px] tracking-widest text-[#D4AF37] uppercase mb-2 font-sans">Teruntuk</p>
              <h3 className="text-xl font-medium text-[#F0E8D8] mb-2">{guestName}</h3>
              {session && (
                <div className="inline-block bg-[#0B2419] border border-[#D4AF37]/20 px-4 py-1 rounded-full mt-2">
                  <p className="text-[10px] text-[#D4AF37] font-sans tracking-wider uppercase">Sesi: {session}</p>
                </div>
              )}
            </div>
          </motion.section>

          {/* Open House Details (Optional) */}
          {eventDate && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="px-6 py-12 text-center border-t border-[#D4AF37]/20"
            >
              <p className="text-[10px] tracking-[0.3em] text-[#D4AF37] uppercase mb-8 font-sans">
                Undangan Open House
              </p>

              <div className="mb-8">
                <p className="text-3xl mb-3 opacity-80">📅</p>
                <p className="text-lg font-bold text-[#F0E8D8]">
                  {format(eventDate, "EEEE, d MMMM yyyy", { locale: localeId })}
                </p>
                <p className="text-sm text-[#D4AF37] mt-1 font-sans">
                  {format(eventDate, "HH:mm")} WIB
                </p>
              </div>

              <div className="mb-8">
                <p className="text-3xl mb-3 opacity-80">📍</p>
                <p className="text-lg font-bold text-[#F0E8D8] mb-2">{c.venue}</p>
                {c.address && (
                  <p className="text-sm text-gray-400 px-4">{c.address}</p>
                )}
              </div>
            </motion.section>
          )}

          {/* RSVP Section */}
          {rsvp?.enabled && eventDate && (
            <motion.section 
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="px-6 py-12 bg-[#113A28]/30 text-center border-t border-[#D4AF37]/20"
            >
              <p className="text-sm text-gray-400 mb-6 font-sans">
                Mohon konfirmasi kehadiran Anda untuk mempererat tali silaturahmi.
              </p>
              <button
                onClick={() => onRsvp?.("attending")}
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#9A7B2C] text-[#0B2419] text-xs font-bold tracking-[0.2em] uppercase rounded-full shadow-lg hover:shadow-[#D4AF37]/20 transition-all"
              >
                Konfirmasi Kehadiran
              </button>
            </motion.section>
          )}
          
          <div className="py-12 text-center opacity-50">
            <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto fill-[#D4AF37]">
               <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5h-13L12 6.5z"/>
            </svg>
          </div>

        </motion.div>
      )}
    </div>
  );
}