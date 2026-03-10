"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Plus, Trash2, FileSpreadsheet, Save, Loader2 } from "lucide-react";
import Papa from "papaparse"; 

export default function GuestManagement({ invitationId }) {
  const supabase = createClient();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualName, setManualName] = useState("");

  const addManualGuest = () => {
    if (!manualName) return;
    const newGuest = { 
      name: manualName, 
      slug: manualName.toLowerCase().replace(/ /g, "-") 
    };
    setGuests([...guests, newGuest]);
    setManualName("");
  };

  const handleCSV = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedGuests = results.data.map(row => ({
          name: row.name || row.Nama,
          whatsapp: row.whatsapp || row.WA,
          slug: (row.name || row.Nama).toLowerCase().replace(/ /g, "-")
        }));
        setGuests([...guests, ...parsedGuests]);
      }
    });
  };

  const saveGuests = async () => {
    setLoading(true);
    const dataToInsert = guests.map(g => ({
      invitation_id: invitationId,
      ...g
    }));

    const { error } = await supabase.from("guests").insert(dataToInsert);
    
    if (!error) alert("Data tamu berhasil disimpan!");
    else alert(error.message);
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Daftar Tamu</h2>
        <button 
          onClick={saveGuests}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
          Simpan Semua
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Nama Tamu..." 
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            className="flex-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={addManualGuest} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <label className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium">Upload CSV Tamu</span>
          <input type="file" accept=".csv" onChange={handleCSV} className="hidden" />
        </label>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Nama Tamu</th>
              <th className="p-3">WhatsApp</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {guests.map((guest, idx) => (
              <tr key={idx}>
                <td className="p-3 font-medium">{guest.name}</td>
                <td className="p-3 text-gray-500">{guest.whatsapp || "-"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setGuests(guests.filter((_, i) => i !== idx))}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}