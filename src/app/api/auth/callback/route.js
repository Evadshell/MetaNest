// app/api/auth/callback/route.js
import { handleAuth, handleCallback } from "@auth0/nextjs-auth0";

export const GET = handleAuth({
  callback: async (req) => {
    try {
      const { state } = req.query;
      const decodedState = JSON.parse(atob(state));
      
      if (decodedState.action === 'link') {
        // Simple success response that closes the popup
        const script = `
          <script>
            window.opener.postMessage({
              type: 'link_complete',
              success: true
            }, '*');
            window.close();
          </script>
        `;
        return new Response(script, {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      
      // Handle normal authentication
      return handleCallback(req);
    } catch (error) {
      console.error('Callback error:', error);
      return new Response(error.message, { status: 500 });
    }
  },
});