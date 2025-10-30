import React, { useState } from "react";

export default function EncryptForm() {
  const [message, setMessage] = useState("");
  const [expiry, setExpiry] = useState(60);
  const [views, setViews] = useState(0);
  const [mode, setMode] = useState('time'); // 'time' or 'views'
  const [password, setPassword] = useState("");
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

    // Determine mutually exclusive expiry policy
    const selectedExpiry = Number(expiry) || 0;
    const selectedViews = Number(views) || 0;
    const useTimeOnly = mode === 'time' && selectedExpiry > 0;
    const useViewsOnly = mode === 'views' && selectedViews > 0;
    // hash password client-side (SHA-256 hex) if provided
    let passwordHash = "";
    if (password && password.length > 0) {
      const pwBytes = new TextEncoder().encode(password);
      const digest = await window.crypto.subtle.digest('SHA-256', pwBytes);
      const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
      passwordHash = hex;
    }

    const payload = {
      id: crypto.randomUUID(),
      encryptedMessage: JSON.stringify({
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted)),
        key: Array.from(key),
      }),
      expirySeconds: useTimeOnly ? selectedExpiry : 0,
      maxViews: useViewsOnly ? selectedViews : 0,
      passwordHash,
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

          {/* Optional password */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <label className="label" htmlFor="password">password (optional)</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                placeholder="Set a password to protect the note"
              />
            </div>
          </div>

          {/* Expiry mode toggle */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <fieldset className="flex gap-6 items-center">
                <legend className="label m-0">expire by</legend>
                <label className="inline-flex items-center gap-2 text-green-200">
                  <input
                    type="radio"
                    name="expire-mode"
                    value="time"
                    checked={mode === 'time'}
                    onChange={() => {
                      setMode('time');
                      setViews(0);
                      if(!(Number(expiry) > 0)) setExpiry(60);
                    }}
                  />
                  time
                </label>
                <label className="inline-flex items-center gap-2 text-green-200">
                  <input
                    type="radio"
                    name="expire-mode"
                    value="views"
                    checked={mode === 'views'}
                    onChange={() => {
                      setMode('views');
                      setExpiry(0);
                    }}
                  />
                  views
                </label>
              </fieldset>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="expiry-seconds">
                time (seconds)
              </label>
              <input
                id="expiry-seconds"
                type="number"
                value={expiry}
                onChange={(e) => setExpiry(Number(e.target.value))}
                className="field"
                placeholder="Expiry in seconds"
                min={0}
                disabled={mode !== 'time'}
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
                onChange={(e) => setViews(Number(e.target.value))}
                className="field"
                placeholder="Max views"
                min={0}
                disabled={mode !== 'views'}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <button
              onClick={encryptMessage}
              className="btn-primary px-5 py-2.5"
              disabled={(mode === 'time' && !(Number(expiry) > 0)) || (mode === 'views' && !(Number(views) > 0))}
            >
              create
            </button>
          </div>

          {link && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={link}
                  className="field flex-1"
                />
                <button
                  className="btn-secondary px-3 py-2"
                  onClick={() => navigator.clipboard.writeText(link)}
                  title="Copy link"
                >
                  copy
                </button>
              </div>
              <div>
                <div className="label mb-2">qr code</div>
                <img
                  alt="qr"
                  className="bg-black/40 p-2 rounded"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`}
                />
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-green-500/70">
          {mode === 'time' && Number(expiry) > 0
            ? `the note will expire in ${Number(expiry)}s`
            : mode === 'views' && Number(views) > 0
            ? `the note will expire after ${Number(views)} view(s)`
            : mode === 'time'
            ? 'set time > 0 to enable expiry'
            : 'set views > 0 to enable expiry'}
        </p>
      </div>
    </div>
  );
}
