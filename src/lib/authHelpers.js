export const linkAccount = async (provider) => {
    try {
      // First, get the management token
      const tokenResponse = await fetch('/api/auth/management-token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get management token');
      }
      const { access_token } = await tokenResponse.json();
  
      // Get the current user's information
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }
      const user = await userResponse.json();
  
      // Open the GitHub authorization popup
      const popup = window.open(
        `${process.env.NEXT_PUBLIC_AUTH0_ISSUER_BASE_URL}/authorize` +
          `?response_type=code` +
          `&client_id=${process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}` +
          `&connection=${provider}` +
          `&redirect_uri=${window.location.origin}/api/auth/callback` +
          `&scope=openid profile email` +
          `&prompt=consent` +
          `&state=${btoa(JSON.stringify({
            action: 'link',
            provider,
            user_id: user.sub,
            token: access_token,
          }))}`,
        'LinkAccount',
        'width=500,height=600'
      );
  
      // Check if the popup was successfully opened
      if (!popup || popup.closed) {
        throw new Error('Failed to open the account linking popup');
      }
  
      // Wait for the popup to be closed
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (popup.closed) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
  
      // Verify the link was successful
      const verifyResponse = await fetch('/api/auth/verify-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          user_id: user.sub,
        }),
      });
      if (!verifyResponse.ok) {
        throw new Error('Failed to verify account link');
      }
  
      return true;
    } catch (error) {
      console.error('Link account error:', error);
      throw error;
    }
  };