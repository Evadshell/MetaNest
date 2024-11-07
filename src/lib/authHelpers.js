// lib/authHelpers.js
export const linkAccount = async (connectionName) => {
    try {
      // Get access token from Auth0
      const tokenResponse = await fetch('/api/auth/management-token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!tokenResponse.ok) {
        throw new Error('Failed to get management token');
      }
  
      const { access_token } = await tokenResponse.json();
  
      // Open Auth0 login in a popup
      const popup = window.open(
        `${process.env.NEXT_PUBLIC_AUTH0_ISSUER_BASE_URL}/authorize?` +
        `response_type=token id_token&` +
        `client_id=${process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}&` +
        `connection=${connectionName}&` +
        `redirect_uri=${window.location.origin}/callback&` +
        `scope=openid profile email&` +
        `prompt=login&` +
        `nonce=${Math.random().toString(36).substring(2)}`,
        'Auth0 Popup',
        'width=500,height=600'
      );
  
      const secondaryIdToken = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Popup timed out'));
        }, 60000);
  
        window.addEventListener('message', async (event) => {
          if (event.origin !== window.location.origin || !event.data.type === 'auth_token') {
            return;
          }
          
          clearTimeout(timeout);
          resolve(event.data.id_token);
        });
      });
  
      // Get current user's sub from the API
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }
      const user = await userResponse.json();
  
      // Link the accounts
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH0_ISSUER_BASE_URL}/api/v2/users/${user.sub}/identities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            link_with: secondaryIdToken,
          }),
        }
      );
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to link account');
      }
  
      return { success: true };
    } catch (error) {
      console.error('Error linking account:', error);
      throw error;
    }
  };
  