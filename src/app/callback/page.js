'use client';
import { useEffect } from 'react';

export default function Callback() {
  useEffect(() => {
    if (window.opener) {
      // Get the ID token from the URL hash
      const params = new URLSearchParams(
        window.location.hash.substring(1) // Remove the leading #
      );
      
      const idToken = params.get('id_token');
      
      if (idToken) {
        // Send the token back to the opener window
        window.opener.postMessage(
          { type: 'auth_token', id_token: idToken },
          window.location.origin
        );
      }
      
      // Close the popup
      window.close();
    }
  }, []);

  return <div>Processing authentication...</div>;
}