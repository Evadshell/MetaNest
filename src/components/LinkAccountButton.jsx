import React, { useState } from 'react';

const LinkAccountButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLinkAccount = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Fetch the secondary account ID token (this could be obtained after a separate login flow)
      const secondaryIdToken = prompt("Enter the ID Token of the secondary account:");

      const response = await fetch('/api/link-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secondaryIdToken })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Accounts linked successfully!');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Failed to link accounts.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleLinkAccount} disabled={loading}>
        {loading ? 'Linking...' : 'Link Another Account'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default LinkAccountButton;
