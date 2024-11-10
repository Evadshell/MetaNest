import { getSession } from '@auth0/nextjs-auth0';
export async function POST(req) {
  try {
    const { provider, user_id } = await req.json();
    const session = await getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
      });
    }
    const tokenResponse = await fetch(
      `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          audience: `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/`,
          grant_type: 'client_credentials',
        }),
      }
    );
    const { access_token } = await tokenResponse.json();
    // Verify the link by checking user's identities
    const userResponse = await fetch(
      `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/users/${user_id}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    const userData = await userResponse.json();
    const isLinked = userData.identities.some((id) => id.provider === provider);
    if (!isLinked) {
      return new Response(JSON.stringify({ error: 'Account linking failed' }), {
        status: 400,
      });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Verify link error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}