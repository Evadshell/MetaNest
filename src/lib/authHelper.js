// authHelper.js
export const linkAccount = async (provider) => {
    try {
      // Construct Auth0 URL with test callback
      const authUrl = new URL('https://dev-3ppgvdko0mblf0zk.us.auth0.com/authorize');
      const params = {
        client_id: 'oxjtfukZNhLcDZbz6n3fzRK0kPRm017L',
        response_type: 'code',
        connection: 'github',
        redirect_uri: 'https://manage.auth0.com/tester/callback',
        scope: 'openid profile email',
        audience: 'https://dev-3ppgvdko0mblf0zk.us.auth0.com/api/v2/',
        prompt: 'consent'
      };
  
      // Add all params to URL
      Object.entries(params).forEach(([key, value]) => {
        authUrl.searchParams.append(key, value);
      });
  
      // Open popup with the URL
      const popup = window.open(
        authUrl.toString(),
        'LinkAccount',
        'width=500,height=700,left=100,top=100'
      );
  
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
  
      // Return a promise that resolves when popup closes
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (popup.closed) {
            clearInterval(interval);
            resolve(true);
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Link account error:', error);
      throw error;
    }
  };