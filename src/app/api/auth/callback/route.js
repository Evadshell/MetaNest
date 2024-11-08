import { handleAuth } from "@auth0/nextjs-auth0";

export const GET = handleAuth({
    callback: async (req, res) => {
      try {
        const { state } = req.query;
        const decodedState = JSON.parse(atob(state));
        if (decodedState.action === 'link') {
          // Handle account linking callback
          const script = `
          <script>
          window.opener.postMessage({
            type: 'link_complete',
            success: true
          }, '${process.env.NEXT_PUBLIC_APP_URL}');
          window.close();
          </script>
          `;
          return new Response(script, {
            headers: { 'Content-Type': 'text/html' },
          });
        }
  
        // Handle normal authentication callback
        return handleCallback(req, res);
      } catch (error) {
        console.error('Callback error:', error);
        return new Response(error.message, { status: 500 });
      }
    },
  });