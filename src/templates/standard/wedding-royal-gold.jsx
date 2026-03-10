import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const TEMPLATE_SCHEMA = {
  meta: {
    name: "Premium Royal Gold",
    category: "wedding",
    description: "Desain pernikahan eksklusif dengan efek partikel emas dan musik.",
    tags: ["gold", "luxury", "dark", "premium"],
    color_palette: ["#080b10", "#d4af37", "#f2ebd9", "#1a1510"],
    is_premium: true,
  },
  content_schema: {
    sections: [
      {
        id: "couple",
        label: "Mempelai",
        icon: "heart",
        fields: [
          { key: "groom_name", label: "Mempelai Pria", type: "text", required: true, placeholder: "William" },
          { key: "bride_name", label: "Mempelai Wanita", type: "text", required: true, placeholder: "Eleanor" },
        ],
      },
      {
        id: "event",
        label: "Acara",
        icon: "calendar",
        fields: [
          { key: "event_date", label: "Tanggal & Waktu", type: "datetime", required: true },
          { key: "venue", label: "Lokasi Acara", type: "text", required: true },
        ],
      },
      {
        id: "media",
        label: "Media & Pesan",
        icon: "music",
        fields: [
          { key: "music_url", label: "URL Musik (MP3)", type: "url", required: false },
          { key: "message", label: "Pesan", type: "textarea", required: false },
        ],
      },
    ],
  },
  guest_schema: {
    extra_fields: [
      { key: "vip_status", label: "Status VIP", type: "select", required: false, default: "Reguler" },
    ],
  },
  default_content: {
    groom_name: "William",
    bride_name: "Eleanor",
    event_date: "2026-12-31T19:00:00",
    venue: "The Ritz-Carlton Grand Ballroom",
    music_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    message: "Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu berkenan hadir untuk memberikan doa restu.",
  },
};

export default function WeddingRoyalGold({ content = {}, guest = {}, rsvp = {}, onRsvp }) {
  const [isOpened, setIsOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  const c = { ...TEMPLATE_SCHEMA.default_content, ...content };
  const guestName = guest?.name || "Tamu Undangan";
  const vipStatus = guest?.custom_data?.vip_status || "Reguler";
  const eventDate = c.event_date ? new Date(c.event_date) : new Date();

  const handleOpen = () => {
    setIsOpened(true);
    if (audioRef.current && c.music_url) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log("Audio failed:", e));
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  // Gold Particle Engine
  useEffect(() => {
    if (!isOpened || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width, height, particles = [], animationId;

    const init = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random()
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };

    init(); draw();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", init); };
  }, [isOpened]);

  return (
    <div className="min-h-screen bg-[#080b10] text-[#f2ebd9] font-serif overflow-hidden relative">
      {c.music_url && <audio ref={audioRef} src={c.music_url} loop />}

      {/* Music Controller */}
      <AnimatePresence>
        {isOpened && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={toggleMusic}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full border border-[#d4af37] bg-black/40 backdrop-blur-sm flex items-center justify-center text-[#d4af37]"
          >
            {isPlaying ? "⏸" : "▶"}
          </motion.button>
        )}
      </AnimatePresence>

      {/* COVER / SPLASH */}
      <AnimatePresence>
        {!isOpened && (
          <motion.div
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 1, ease: [0.8, 0, 0.2, 1] }}
            className="fixed inset-0 z-40 bg-[#080b10] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="border border-[#d4af37]/30 p-10 rounded-2xl w-full max-w-sm">
              <h1 className="text-5xl text-[#d4af37] mb-4 italic">{c.groom_name} & {c.bride_name}</h1>
              <p className="text-xs tracking-[0.2em] uppercase mb-10 text-gray-400 font-sans">The Wedding</p>
              
              <div className="mb-10">
                <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2 font-sans">Dear,</p>
                <h2 className="text-xl mb-2">{guestName}</h2>
                {vipStatus !== "Reguler" && (
                  <span className="bg-[#d4af37] text-black text-[10px] px-2 py-1 rounded font-bold uppercase">{vipStatus}</span>
                )}
              </div>

              <button
                onClick={handleOpen}
                className="w-full py-4 bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black text-xs font-bold tracking-[0.2em] rounded-full uppercase"
              >
                Buka Undangan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      {isOpened && (
        <>
          <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
          <div className="relative z-10 max-w-md mx-auto h-screen overflow-y-auto pb-32">
            
            <motion.section 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6"
            >
              <p className="text-xs tracking-[0.3em] uppercase text-[#d4af37] mb-8 font-sans">We Are Getting Married</p>
              <h1 className="text-6xl italic leading-tight">{c.groom_name}</h1>
              <span className="text-3xl text-[#d4af37] italic my-2">&</span>
              <h1 className="text-6xl italic leading-tight">{c.bride_name}</h1>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="px-6 py-16"
            >
              <div className="bg-white/5 backdrop-blur-md border border-[#d4af37]/20 rounded-3xl p-8 text-center">
                <span className="text-3xl mb-4 block">🗓</span>
                <h3 className="text-lg font-sans mb-2 text-[#d4af37]">{format(eventDate, "EEEE, d MMMM yyyy", { locale: localeId })}</h3>
                <p className="text-sm text-gray-400 font-sans mb-4">{format(eventDate, "HH:mm")} WIB</p>
                <p className="text-sm leading-relaxed">{c.venue}</p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="px-8 py-16 text-center"
            >
              <p className="text-sm italic text-gray-400 leading-loose">"{c.message}"</p>
            </motion.section>

            {rsvp?.enabled && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="px-6 py-10"
              >
                <button
                  onClick={() => onRsvp?.("attending", "Saya akan hadir!")}
                  className="w-full py-4 border border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37] rounded-xl font-sans text-xs tracking-[0.2em] uppercase transition hover:bg-[#d4af37]/20"
                >
                  Konfirmasi Kehadiran
                </button>
              </motion.section>
            )}

          </div>
        </>
      )}
    </div>
  );
}