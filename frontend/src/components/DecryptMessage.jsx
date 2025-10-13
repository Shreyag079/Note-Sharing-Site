import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function DecryptMessage(){
  const { id } = useParams();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchMessage = async () => {
      const res = await fetch(`http://localhost:8000/api/message/${id}`);
      if(!res.ok) { setMessage('Message expired or not found'); return; }
      const data = await res.json();
      const payload = JSON.parse(data.encryptedMessage);
      const key = new Uint8Array(payload.key);
      const iv = new Uint8Array(payload.iv);
      const encryptedData = new Uint8Array(payload.data);

      const cryptoKey = await window.crypto.subtle.importKey(
        'raw', key, 'AES-GCM', true, ['decrypt']
      );

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encryptedData
      );

      const decoder = new TextDecoder();
      setMessage(decoder.decode(decrypted));
    };
    fetchMessage();
  }, [id]);

  return <div className="p-6 max-w-lg mx-auto">{message}</div>;
}