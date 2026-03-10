import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ============================================================
// TEMPLATE_SCHEMA
// ============================================================
export const TEMPLATE_SCHEMA = {
  meta: {
    name: "Birthday Envelope Magic",
    category: "birthday",
    description: "Undangan ulang tahun interaktif dengan animasi membuka amplop dan musik.",
    tags: ["envelope", "animation", "premium", "birthday", "interactive"],
    color_palette: ["#FDF8F5", "#D4C5B9", "#A34343", "#8C736A"],
    is_premium: true,
  },

  content_schema: {
    sections: [
      {
        id: "profile",
        label: "Data Ulang Tahun",
        icon: "user",
        fields: [
          { key: "name", label: "Nama Rayakan", type: "text", required: true, placeholder: "Natasha" },
          { key: "age", label: "Ulang Tahun Ke-", type: "number", required: true, placeholder: "17" },
          { key: "photo", label: "Foto Profil", type: "image", required: false, aspect_ratio: "1:1" },
        ],
      },
      {
        id: "event",
        label: "Detail Acara",
        icon: "calendar",
        fields: [
          { key: "event_date", label: "Tanggal & Waktu Acara", type: "datetime", required: true },
          { key: "venue", label: "Nama Tempat", type: "text", required: true, placeholder: "The Grand Ballroom" },
          { key: "address", label: "Alamat Lengkap", type: "textarea", required: false },
          { key: "dress_code", label: "Dress Code", type: "text", required: false, placeholder: "Earthy Tones / Pastel" },
        ],
      },
      {
        id: "media",
        label: "Musik & Pesan",
        icon: "music",
        fields: [
          { key: "music_url", label: "URL Musik (MP3)", type: "url", required: false },
          { key: "message", label: "Pesan Undangan", type: "textarea", required: false },
        ],
      },
    ],
  },

  guest_schema: {
    extra_fields: [
      { key: "table_number", label: "Nomor Meja", type: "text", required: false, placeholder: "VVIP-1" },
    ],
  },

  default_content: {
    name: "Natasha Romanoff",
    age: 21,
    photo: null,
    event_date: "2026-11-20T19:00:00",
    venue: "The Glass House",
    address: "Jl. Senopati No. 88, Jakarta Selatan",
    dress_code: "Elegant Evening Wear",
    music_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    message: "Merupakan sebuah kebahagiaan bagi saya untuk merayakan hari spesial ini bersama orang-orang terkasih.",
  },
};

// ============================================================
// COMPONENT
// ============================================================
export default function BirthdayEnvelope({ content = {}, guest = {}, rsvp = {}, onRsvp }) {
  // 0: idle, 1: flap opening, 2: card pulling up, 3: fading out, 4: main content
  const [envelopeState, setEnvelopeState] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const c = { ...TEMPLATE_SCHEMA.default_content, ...content };
  const guestName = guest?.name || "Tamu Kehormatan";
  const tableNo = guest?.custom_data?.table_number || "";
  const eventDate = c.event_date ? new Date(c.event_date) : new Date();

  // Sequence Animasi Amplop
  const handleOpenEnvelope = () => {
    if (audioRef.current && c.music_url) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log(e));
    }
    
    setEnvelopeState(1); // Buka flap atas
    setTimeout(() => setEnvelopeState(2), 800); // Tarik kartu ke atas
    setTimeout(() => setEnvelopeState(3), 1600); // Amplop turun & menghilang
    setTimeout(() => setEnvelopeState(4), 2200); // Tampilkan halaman utama
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-[#FDF8F5] text-[#4A3B32] font-serif overflow-hidden relative">
      {/* Background Audio */}
      {c.music_url && <audio ref={audioRef} src={c.music_url} loop />}

      {/* Floating Music Controller (Muncul setelah amplop hilang) */}
      <AnimatePresence>
        {envelopeState === 4 && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={toggleMusic}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full border border-[#D4C5B9] bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#A34343] shadow-md"
          >
            {isPlaying ? "⏸" : "▶"}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── SPLASH SCREEN (ANIMASI AMPLOP) ── */}
      <AnimatePresence>
        {envelopeState < 4 && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FDF8F5] p-6"
          >
            {/* Header Sapaan */}
            <motion.div 
              animate={envelopeState >= 3 ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
              className="mb-12 text-center"
            >
              <p className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-2">You are invited</p>
              <h2 className="text-2xl font-medium italic text-[#8C736A]">{guestName}</h2>
            </motion.div>

            {/* Container Amplop */}
            <motion.div 
              animate={envelopeState === 3 ? { y: 200, opacity: 0, scale: 0.9 } : { y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="relative w-full max-w-sm aspect-[4/3]"
            >
              {/* 1. Bagian Belakang Amplop */}
              <div className="absolute inset-0 bg-[#C4B4A5] rounded-lg shadow-xl" />

              {/* 2. Kartu Undangan (Isi) */}
              <motion.div
                initial={{ y: 0, zIndex: 10 }}
                animate={envelopeState >= 2 ? { y: -120, zIndex: 30 } : { y: 0, zIndex: 10 }}
                transition={{ duration: 0.8, ease: "backOut" }}
                className="absolute inset-4 bg-[#FFFaf7] rounded shadow-md flex flex-col items-center justify-center p-6 text-center border border-[#F2E8DF]"
              >
                <div className="text-3xl mb-3">✨</div>
                <h1 className="text-2xl text-[#8C736A] font-bold mb-1">{c.name}</h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Turns {c.age}</p>
              </motion.div>

              {/* 3. Saku Amplop (Front Bottom) - CSS Clip Path */}
              <div 
                className="absolute inset-0 z-20 rounded-lg pointer-events-none"
                style={{ 
                  backgroundColor: "#D4C5B9",
                  clipPath: "polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%)"
                }} 
              />
              <div 
                className="absolute inset-0 z-20 rounded-lg pointer-events-none"
                style={{ 
                  background: "linear-gradient(to top, rgba(0,0,0,0.08) 0%, transparent 40%)",
                  clipPath: "polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%)"
                }} 
              />

              {/* 4. Flap Amplop (Top) - Rotasi 3D */}
              <motion.div
                initial={{ rotateX: 0 }}
                animate={envelopeState >= 1 ? { rotateX: 180, zIndex: 5 } : { rotateX: 0, zIndex: 25 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ transformOrigin: "top" }}
                className="absolute top-0 left-0 w-full h-[65%] rounded-t-lg"
              >
                 <div 
                    className="w-full h-full"
                    style={{ 
                      backgroundColor: envelopeState >= 1 ? "#C4B4A5" : "#DCD0C6", // Warna lebih gelap saat terbuka (bagian dalam)
                      clipPath: "polygon(0 0, 100% 0, 50% 100%)"
                    }} 
                 />
                 <div 
                    className="absolute inset-0"
                    style={{ 
                      background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, transparent 100%)",
                      clipPath: "polygon(0 0, 100% 0, 50% 100%)"
                    }} 
                 />
              </motion.div>

              {/* 5. Segel (Wax Seal / Button) */}
              {envelopeState === 0 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleOpenEnvelope}
                  className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-16 h-16 bg-[#A34343] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center text-white border-2 border-[#A34343] outline outline-2 outline-offset-2 outline-[#E9C46A]/50"
                >
                  <span className="text-[10px] tracking-widest font-bold uppercase">Open</span>
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT (Halaman Utama) ── */}
      {envelopeState === 4 && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md mx-auto"
        >
          {/* Hero Section */}
          <section className="min-h-screen flex flex-col items-center justify-center px-8 text-center pt-10 pb-20">
            {c.photo && (
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={c.photo}
                alt="Profile"
                className="w-40 h-40 object-cover rounded-full shadow-lg mb-8 border-4 border-white"
              />
            )}

            <p className="text-[10px] tracking-[0.4em] text-gray-400 uppercase mb-4 font-sans">
              Please join us for
            </p>
            <h1 className="text-5xl text-[#8C736A] font-bold mb-4 leading-tight">
              {c.name}'s <br /> Birthday
            </h1>
            <div className="inline-block bg-[#EAE0D5] text-[#8C736A] px-6 py-2 rounded-full text-sm tracking-widest uppercase mb-8">
              Turning {c.age}
            </div>

            <p className="text-sm text-gray-500 italic leading-relaxed px-4">
              "{c.message}"
            </p>
          </section>

          {/* Guest Card Info */}
          <section className="px-6 py-10">
            <div className="bg-white border border-[#EAE0D5] p-6 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-2 font-sans">Reserved For</p>
              <h3 className="text-xl font-medium text-[#8C736A] mb-4">{guestName}</h3>
              
              <div className="flex justify-center gap-6 border-t border-[#EAE0D5] pt-4">
                {tableNo && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-sans mb-1">Table</p>
                    <p className="font-bold text-[#4A3B32]">{tableNo}</p>
                  </div>
                )}
                {c.dress_code && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-sans mb-1">Dress Code</p>
                    <p className="font-bold text-[#4A3B32]">{c.dress_code}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Event Details */}
          <section className="px-6 py-12 text-center border-t border-[#EAE0D5]">
            <p className="text-[10px] tracking-[0.3em] text-[#8C736A] uppercase mb-8 font-sans">
              Waktu & Lokasi
            </p>

            <div className="mb-8">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-lg font-bold text-[#4A3B32]">
                {format(eventDate, "EEEE, d MMMM yyyy", { locale: localeId })}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {format(eventDate, "HH:mm")} WIB
              </p>
            </div>

            <div className="mb-8">
              <p className="text-4xl mb-3">📍</p>
              <p className="text-lg font-bold text-[#4A3B32]">{c.venue}</p>
              {c.address && (
                <p className="text-sm text-gray-500 mt-2 px-4">{c.address}</p>
              )}
            </div>
          </section>

          {/* RSVP Section */}
          {rsvp?.enabled && (
            <section className="px-6 py-16 bg-[#F4EBE1] text-center border-t border-[#EAE0D5]">
              <p className="text-sm text-gray-600 mb-6 italic">
                Kehadiran Anda adalah hadiah terbaik.
              </p>
              <button
                onClick={() => onRsvp?.("attending")}
                className="w-full py-4 bg-[#8C736A] text-white text-xs font-bold tracking-[0.2em] uppercase rounded-full shadow-lg hover:bg-[#A34343] transition-colors"
              >
                Konfirmasi Kehadiran
              </button>
            </section>
          )}
          
        </motion.div>
      )}
    </div>
  );
}