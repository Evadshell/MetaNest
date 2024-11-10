import { getAccessToken, withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

const handler = async (req, res) => {
    try {
        const session = getSession(req, res);

        if (!session || !session.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { user } = session;

        // Get an Access Token with the required scope
        const { accessToken } = await getAccessToken(req, res, {
            scopes: ['update:current_user_identities']
        });

        const { secondaryIdToken } = req.body;

        // Make a request to Auth0 Management API to link the accounts
        const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${user.sub}/identities`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ link_with: secondaryIdToken })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: data.error_description || 'Failed to link accounts' });
        }

        res.status(200).json({ message: 'Accounts linked successfully', data });
    } catch (error) {
        console.error('Account linking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export default withApiAuthRequired(handler);
