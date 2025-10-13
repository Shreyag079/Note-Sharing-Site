import React, { useState } from "react";

export default function EncryptForm() {
  const [message, setMessage] = useState("");
  const [expiry, setExpiry] = useState(60);
  const [views, setViews] = useState(1);
  const [link, setLink] = useState("");

  const generateKey = () => window.crypto.getRandomValues(new Uint8Array(32));

  const encryptMessage = async () => {
    const key = generateKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      key,
      "AES-GCM",
      true,
      ["encrypt"]
    );

    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encoded
    );

    const payload = {
      id: crypto.randomUUID(),
      encryptedMessage: JSON.stringify({
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted)),
        key: Array.from(key),
      }),
      expirySeconds: expiry,
      maxViews: views,
    };

    const res = await fetch("http://localhost:8000/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setLink(`http://localhost:5173/retrieve/${payload.id}`);
    }
  };

  return (
    <div className="app-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header with logo */}
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
            <div className="text-xs text-green-500/70">
              Fully encrypted notes & files
            </div>
          </div>
        </div>

        <div className="card p-6">
          <label className="label" htmlFor="secret-note">
            note
          </label>
          <textarea
            id="secret-note"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="field min-h-[260px] resize-y"
            placeholder="Type your secret message..."
          />

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="expiry-seconds">
                time (seconds)
              </label>
              <input
                id="expiry-seconds"
                type="number"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="field"
                placeholder="Expiry in seconds"
              />
            </div>
            <div>
              <label className="label" htmlFor="max-views">
                views (max)
              </label>
              <input
                id="max-views"
                type="number"
                value={views}
                onChange={(e) => setViews(e.target.value)}
                className="field"
                placeholder="Max views"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <button
              onClick={encryptMessage}
              className="btn-primary px-5 py-2.5"
            >
              create
            </button>
          </div>

          {link && (
            <p className="mt-4 text-sm text-green-400/90 break-all">
              Shareable Link: <span className="text-green-300">{link}</span>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-green-500/70">
          the note will expire and be destroyed after 1 view.
        </p>
      </div>
    </div>
  );
}
