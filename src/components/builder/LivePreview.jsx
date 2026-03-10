"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export default function LivePreview({ content, template }) {
  const iframeRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Fungsi untuk kirim data
  const sendData = useCallback(() => {
    if (iframeRef.current?.contentWindow && isReady) {
      iframeRef.current.contentWindow.postMessage({
        type: "UPDATE_INVITATION_DATA",
        content: content,
        template: template
      }, "*");
    }
  }, [content, template, isReady]);

  // Kirim data setiap kali content berubah ATAU saat iframe baru saja ready
  useEffect(() => {
    sendData();
  }, [sendData]);

  // Dengerin sinyal "READY" dari iframe
  useEffect(() => {
    const handleReady = (e) => {
      if (e.data.type === "IFRAME_READY") {
        setIsReady(true);
      }
    };
    window.addEventListener("message", handleReady);
    return () => window.removeEventListener("message", handleReady);
  }, []);

  return (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center p-4">
      <div className="w-[320px] h-[600px] bg-white shadow-2xl rounded-[2.5rem] border-[8px] border-gray-900 overflow-hidden relative">
        <iframe
          ref={iframeRef}
          // Tambahkan timestamp agar iframe refresh kalau ganti template total
          src={`/dashboard/user/builder/preview-frame?id=${template?.id}`}
          className="w-full h-full border-0"
          title="Live Preview"
        />
      </div>
    </div>
  );
}
