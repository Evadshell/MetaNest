export const auth0Config = {
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    secret: process.env.AUTH0_SECRET,
    routes: {
      callback: '/api/auth/callback',
      postLogoutRedirect: '/',
    },
    authorizationParams: {
      response_type: 'code',
      scope: 'openid profile email',
    },
  };