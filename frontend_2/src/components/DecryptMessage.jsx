import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function DecryptMessage() {
  const { id } = useParams();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMessage = async () => {
      const res = await fetch(`http://localhost:8000/api/message/${id}`);
      if (!res.ok) {
        setMessage("Message expired or not found");
        return;
      }
      const data = await res.json();
      const payload = JSON.parse(data.encryptedMessage);
      const key = new Uint8Array(payload.key);
      const iv = new Uint8Array(payload.iv);
      const encryptedData = new Uint8Array(payload.data);

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        key,
        "AES-GCM",
        true,
        ["decrypt"]
      );

      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        encryptedData
      );

      const decoder = new TextDecoder();
      setMessage(decoder.decode(decrypted));
    };
    fetchMessage();
  }, [id]);

  return (
    <div className="app-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <svg
            className="h-10 w-10 text-green-500"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 12c3.5-2.5 6.5-3.5 9-3.5S18.5 9.5 21 12c-2 4-6 7-9 7s-7-3-9-7Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8.5 12.5c1-.8 2-.8 3-.8s2 0 3 .8c-1 2.5-3 4-3 4s-2-1.5-3-4Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <div>
            <div className="text-2xl font-bold text-green-400 tracking-wide">
              Notex
            </div>
            <div className="text-xs text-green-500/70">Decrypted message</div>
          </div>
        </div>

        <div className="card p-6">
          <label className="label" htmlFor="decrypted-note">
            note
          </label>
          <textarea
            id="decrypted-note"
            className="field min-h-[220px] resize-y"
            readOnly
            value={message}
          />
        </div>
      </div>
    </div>
  );
}
