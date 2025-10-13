import React, { useState } from 'react';

export default function EncryptForm() {
  const [message, setMessage] = useState('');
  const [expiry, setExpiry] = useState(60);
  const [views, setViews] = useState(1);
  const [link, setLink] = useState('');

  const generateKey = () => window.crypto.getRandomValues(new Uint8Array(32));

  const encryptMessage = async () => {
    const key = generateKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw', key, 'AES-GCM', true, ['encrypt']
    );

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encoded
    );

    const payload = {
      id: crypto.randomUUID(),
      encryptedMessage: JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)), key: Array.from(key) }),
      expirySeconds: expiry,
      maxViews: views
    };

    const res = await fetch('http://localhost:8000/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if(res.ok){ setLink(`http://localhost:5173/retrieve/${payload.id}`); }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-black">
      <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full p-2 border rounded" placeholder="Type your secret message" />
      <input type="number" value={expiry} onChange={e=>setExpiry(e.target.value)} className="w-full mt-2 p-2 border rounded" placeholder="Expiry in seconds" />
      <input type="number" value={views} onChange={e=>setViews(e.target.value)} className="w-full mt-2 p-2 border rounded" placeholder="Max views" />
      <button onClick={encryptMessage} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">Encrypt & Generate Link</button>
      {link && <p className="mt-2 break-all">Shareable Link: {link}</p>}
    </div>
  );
}