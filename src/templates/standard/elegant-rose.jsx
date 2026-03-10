// ============================================================
// CONVENTION WAJIB untuk semua JSX template di sebar.in
// File ini adalah CONTOH template + dokumentasi cara bikinnya
// ============================================================
//
// ATURAN FILE:
// 1. Harus ada export const TEMPLATE_SCHEMA → ini yang di-parse sistem
// 2. Harus ada default export → React component
// 3. Import hanya dari whitelist (react, framer-motion, dll)
// 4. DILARANG: fetch(), axios, fs, localStorage, process.env
// 5. Semua aset pakai URL dari props (sudah di-resolve server)
//
// WHITELIST IMPORT:
// - react
// - framer-motion
// - date-fns (untuk format tanggal)
// - react-countdown
// ============================================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ============================================================
// TEMPLATE_SCHEMA — DI-PARSE OTOMATIS OLEH SISTEM
// Ini yang generate form di dashboard user
// ============================================================

export const TEMPLATE_SCHEMA = {
  // Metadata template
  meta: {
    name: "Elegant Rose",
    category: "wedding",          // wedding | birthday | graduation | engagement | general
    description: "Template pernikahan elegan dengan nuansa mawar",
    tags: ["floral", "elegant", "romantic", "light"],
    color_palette: ["#FFF5F5", "#E8A0A0", "#C45C6A", "#2D1B1E"],
    is_premium: false,
  },

  // ============================================================
  // content_schema → generate form "Isi Undangan" di dashboard
  // ============================================================
  content_schema: {
    sections: [
      {
        id: "couple",
        label: "Data Pasangan",
        icon: "heart",                // icon hint untuk UI dashboard
        fields: [
          {
            key: "groom_name",        // → props.content.groom_name
            label: "Nama Mempelai Pria",
            type: "text",             // text | textarea | image | image_multiple | datetime | url | number | color | select
            required: true,
            placeholder: "Muhammad Rizki",
            max_length: 80,
          },
          {
            key: "groom_father",
            label: "Nama Ayah Mempelai Pria",
            type: "text",
            required: false,
            placeholder: "Bapak Ahmad",
          },
          {
            key: "bride_name",
            label: "Nama Mempelai Wanita",
            type: "text",
            required: true,
            placeholder: "Siti Nur Aisyah",
          },
          {
            key: "bride_father",
            label: "Nama Ayah Mempelai Wanita",
            type: "text",
            required: false,
          },
          {
            key: "couple_photo",
            label: "Foto Bersama",
            type: "image",
            required: false,
            aspect_ratio: "4:5",
            max_size_mb: 5,
          },
          {
            key: "groom_photo",
            label: "Foto Mempelai Pria",
            type: "image",
            required: false,
            aspect_ratio: "1:1",
            max_size_mb: 3,
          },
          {
            key: "bride_photo",
            label: "Foto Mempelai Wanita",
            type: "image",
            required: false,
            aspect_ratio: "1:1",
            max_size_mb: 3,
          },
        ],
      },
      {
        id: "akad",
        label: "Akad Nikah",
        icon: "calendar",
        fields: [
          {
            key: "akad_date",
            label: "Tanggal & Waktu Akad",
            type: "datetime",
            required: true,
          },
          {
            key: "akad_venue",
            label: "Nama Tempat Akad",
            type: "text",
            required: true,
            placeholder: "Masjid Al-Ikhlas",
          },
          {
            key: "akad_address",
            label: "Alamat Lengkap",
            type: "textarea",
            required: false,
          },
          {
            key: "akad_maps_url",
            label: "Link Google Maps",
            type: "url",
            required: false,
            placeholder: "https://maps.google.com/...",
          },
        ],
      },
      {
        id: "resepsi",
        label: "Resepsi",
        icon: "party",
        fields: [
          {
            key: "resepsi_date",
            label: "Tanggal & Waktu Resepsi",
            type: "datetime",
            required: true,
          },
          {
            key: "resepsi_venue",
            label: "Nama Gedung / Tempat",
            type: "text",
            required: true,
          },
          {
            key: "resepsi_address",
            label: "Alamat Lengkap",
            type: "textarea",
            required: false,
          },
          {
            key: "resepsi_maps_url",
            label: "Link Google Maps",
            type: "url",
            required: false,
          },
        ],
      },
      {
        id: "gallery",
        label: "Galeri Foto",
        icon: "image",
        fields: [
          {
            key: "gallery_photos",
            label: "Foto-foto (maks 12)",
            type: "image_multiple",
            required: false,
            max_count: 12,
            max_size_mb: 5,
          },
        ],
      },
      {
        id: "quotes",
        label: "Kutipan & Pesan",
        icon: "quote",
        fields: [
          {
            key: "opening_quote",
            label: "Kutipan Pembuka (ayat / puisi)",
            type: "textarea",
            required: false,
            max_length: 300,
            placeholder: "Dan di antara tanda-tanda kebesaran-Nya...",
          },
          {
            key: "closing_message",
            label: "Pesan Penutup",
            type: "textarea",
            required: false,
            max_length: 500,
          },
        ],
      },
    ],
  },

  // ============================================================
  // guest_schema → field tambahan data tamu (selain nama & WA)
  // Di-import saat user upload CSV / tambah tamu manual
  // ============================================================
  guest_schema: {
    extra_fields: [
      {
        key: "table_number",
        label: "Nomor Meja",
        type: "text",
        required: false,
        placeholder: "A1",
      },
      {
        key: "seat_count",
        label: "Jumlah Kursi",
        type: "number",
        required: false,
        default: 1,
        min: 1,
        max: 10,
      },
    ],
  },

  // ============================================================
  // default_content → data dummy untuk live preview di iframe
  // ============================================================
  default_content: {
    groom_name: "Muhammad Rizki",
    groom_father: "Bapak Ahmad Fauzi",
    bride_name: "Siti Nur Aisyah",
    bride_father: "Bapak Hendra Kusuma",
    couple_photo: null,
    groom_photo: null,
    bride_photo: null,
    akad_date: "2025-06-15T08:00:00",
    akad_venue: "Masjid Al-Ikhlas",
    akad_address: "Jl. Mawar No. 12, Jakarta Selatan",
    akad_maps_url: "https://maps.google.com",
    resepsi_date: "2025-06-15T11:00:00",
    resepsi_venue: "Gedung Serbaguna Mulia",
    resepsi_address: "Jl. Melati No. 5, Jakarta Selatan",
    resepsi_maps_url: "https://maps.google.com",
    gallery_photos: [],
    opening_quote: "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri. — QS. Ar-Rum: 21",
    closing_message: "Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.",
  },
};

// ============================================================
// DEFAULT EXPORT — React Component
//
// Props yang di-inject sistem:
//   content   → object dari invitations.content (atau default_content)
//   guest     → object { name, slug, custom_data } dari guests table
//   rsvp      → object { enabled, deadline } dari invitations
//   onRsvp    → function(status, message) → callback saat tamu RSVP
// ============================================================

export default function ElegantRoseTemplate({ content = {}, guest = {}, rsvp = {}, onRsvp }) {
  const [isOpened, setIsOpened] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const c = { ...TEMPLATE_SCHEMA.default_content, ...content };
  const guestName = guest?.name || "Tamu Undangan";

  const akadDate = c.akad_date ? new Date(c.akad_date) : null;
  const resepsiDate = c.resepsi_date ? new Date(c.resepsi_date) : null;

  return (
    <div className="min-h-screen bg-[#FFF5F5] font-serif">
      
      {/* ── COVER / SPLASH ── */}
      <AnimatePresence>
        {!isOpened && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFF5F5]"
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8 }}
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-[#C45C6A] tracking-widest uppercase mb-4"
            >
              Undangan Pernikahan
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
              className="text-4xl text-[#2D1B1E] mb-2"
            >
              {c.groom_name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.4 } }}
              className="text-[#C45C6A] text-2xl mb-2"
            >
              &
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
              className="text-4xl text-[#2D1B1E] mb-8"
            >
              {c.bride_name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.7 } }}
              className="text-xs text-gray-500 mb-6"
            >
              Kepada Yth. <span className="text-[#C45C6A] font-semibold">{guestName}</span>
            </motion.p>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.9 } }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsOpened(true)}
              className="px-8 py-3 bg-[#C45C6A] text-white text-sm tracking-widest rounded-full shadow-md"
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
          className="max-w-md mx-auto"
        >
          {/* Hero */}
          <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
            {c.couple_photo && (
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={c.couple_photo}
                alt="Foto bersama"
                className="w-64 h-80 object-cover rounded-2xl shadow-lg mb-8"
              />
            )}

            <p className="text-xs text-[#C45C6A] tracking-widest uppercase mb-3">
              Bismillahirrahmanirrahim
            </p>

            {c.opening_quote && (
              <p className="text-sm text-gray-500 italic leading-relaxed mb-8 px-4">
                "{c.opening_quote}"
              </p>
            )}

            <h2 className="text-3xl text-[#2D1B1E] mb-1">{c.groom_name}</h2>
            <p className="text-xs text-gray-400 mb-4">Putra dari {c.groom_father}</p>
            <p className="text-[#C45C6A] text-xl mb-4">&</p>
            <h2 className="text-3xl text-[#2D1B1E] mb-1">{c.bride_name}</h2>
            <p className="text-xs text-gray-400">Putri dari {c.bride_father}</p>
          </section>

          {/* Akad */}
          {akadDate && (
            <section className="px-6 py-16 text-center border-t border-[#E8A0A0]">
              <p className="text-xs text-[#C45C6A] tracking-widest uppercase mb-4">Akad Nikah</p>
              <p className="text-xl text-[#2D1B1E] mb-1">
                {format(akadDate, "EEEE, d MMMM yyyy", { locale: localeId })}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {format(akadDate, "HH:mm")} WIB
              </p>
              <p className="font-semibold text-[#2D1B1E]">{c.akad_venue}</p>
              {c.akad_address && (
                <p className="text-sm text-gray-400 mt-1">{c.akad_address}</p>
              )}
              {c.akad_maps_url && (
                <a
                  href={c.akad_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-4 px-5 py-2 border border-[#C45C6A] text-[#C45C6A] text-xs rounded-full"
                >
                  Lihat Peta
                </a>
              )}
            </section>
          )}

          {/* Resepsi */}
          {resepsiDate && (
            <section className="px-6 py-16 text-center bg-[#FDE8E8]">
              <p className="text-xs text-[#C45C6A] tracking-widest uppercase mb-4">Resepsi</p>
              <p className="text-xl text-[#2D1B1E] mb-1">
                {format(resepsiDate, "EEEE, d MMMM yyyy", { locale: localeId })}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {format(resepsiDate, "HH:mm")} WIB
              </p>
              <p className="font-semibold text-[#2D1B1E]">{c.resepsi_venue}</p>
              {c.resepsi_address && (
                <p className="text-sm text-gray-400 mt-1">{c.resepsi_address}</p>
              )}
              {c.resepsi_maps_url && (
                <a
                  href={c.resepsi_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-4 px-5 py-2 border border-[#C45C6A] text-[#C45C6A] text-xs rounded-full"
                >
                  Lihat Peta
                </a>
              )}
            </section>
          )}

          {/* RSVP */}
          {rsvp?.enabled && (
            <section className="px-6 py-16 text-center border-t border-[#E8A0A0]">
              <p className="text-xs text-[#C45C6A] tracking-widest uppercase mb-4">Konfirmasi Kehadiran</p>
              <p className="text-sm text-gray-500 mb-6">
                Mohon konfirmasi kehadiran Anda sebelum{" "}
                {rsvp.deadline
                  ? format(new Date(rsvp.deadline), "d MMMM yyyy", { locale: localeId })
                  : "acara berlangsung"}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => onRsvp?.("attending")}
                  className="px-6 py-2 bg-[#C45C6A] text-white text-xs rounded-full"
                >
                  Hadir
                </button>
                <button
                  onClick={() => onRsvp?.("not_attending")}
                  className="px-6 py-2 border border-gray-300 text-gray-500 text-xs rounded-full"
                >
                  Tidak Hadir
                </button>
              </div>
            </section>
          )}

          {/* Closing */}
          {c.closing_message && (
            <section className="px-6 py-16 text-center border-t border-[#E8A0A0]">
              <p className="text-sm text-gray-500 leading-relaxed italic">
                "{c.closing_message}"
              </p>
              <p className="mt-6 text-sm font-semibold text-[#2D1B1E]">
                {c.groom_name} & {c.bride_name}
              </p>
            </section>
          )}

        </motion.div>
      )}
    </div>
  );
}
