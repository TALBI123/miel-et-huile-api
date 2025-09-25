// corrected-auth-flow.js
const { OAuth2Client } = require('google-auth-library');
const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000;

app.get('/auth/google', (req, res) => {
    console.log('🔧 Generating auth URL...');
    
    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `http://localhost:${port}/auth/google/callback`
    );

    // OPTIONS CORRECTES pour generateAuthUrl
    const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ],
        prompt: 'consent',
        include_granted_scopes: true
    });

    console.log('📋 Auth URL generated:');
    console.log('Contains client_id:', authUrl.includes('client_id=') ? '✅' : '❌');
    
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    
    if (!code) {
        return res.status(400).send('No authorization code received');
    }

    console.log('🔧 Received authorization code');

    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `http://localhost:${port}/auth/google/callback`
    );

    try {
        const { tokens } = await client.getToken({
            code: code,
            redirect_uri: `http://localhost:${port}/auth/google/callback`
        });
        
        console.log('✅ Token exchange successful!');
        res.json({
            success: true,
            tokens: {
                access_token: tokens.access_token,
                has_refresh_token: !!tokens.refresh_token
            }
        });
    } catch (error) {
        console.error('❌ Token exchange error:', error.message);
        res.status(400).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`\n🚀 Server running on http://localhost:${port}`);
    console.log(`🌐 Test the flow: http://localhost:${port}/auth/google`);
    console.log(`🔑 Client ID: ${process.env.GOOGLE_CLIENT_ID?.substring(0, 20)}...`);
});