"use client";
import { useState } from 'react';

const LinkAccount = () => {
  const [provider, setProvider] = useState('github');
  const [userId, setUserId] = useState('');

  const handleLinkAccount = async () => {
    try {
      const response = await fetch('/api/linkAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, userId }),
      });

      const data = await response.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert('Account linked successfully!');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      <h1>Link Your Account</h1>
      <input
        type="text"
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button onClick={handleLinkAccount}>Link GitHub Account</button>
    </div>
  );
};

export default LinkAccount;
