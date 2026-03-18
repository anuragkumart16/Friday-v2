import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/tasks"];

/**
 * Creates and returns a configured OAuth2 client.
 */
function createOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.BASE_URL}/api/v1/google-auth/auth/callback`
    );
}

// Singleton OAuth2 client used across the app
const oauth2Client = createOAuth2Client();

// In-memory token storage (replace with DB/file persistence as needed)
let storedTokens: any = null;

/**
 * Generates the Google OAuth2 authorization URL.
 */
export function getAuthUrl(): string {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
    });
}

/**
 * Exchanges an authorization code for tokens and stores them.
 */
export async function handleAuthCallback(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    storedTokens = tokens;
    return tokens;
}

/**
 * Returns whether the client currently holds valid credentials.
 */
export function isAuthorized(): boolean {
    return storedTokens !== null && !!storedTokens.access_token;
}

/**
 * Revokes the current token and clears stored credentials.
 */
export async function revokeAuth() {
    if (storedTokens?.access_token) {
        await oauth2Client.revokeToken(storedTokens.access_token);
    }
    storedTokens = null;
    oauth2Client.setCredentials({});
}

/**
 * Returns the authenticated OAuth2 client.
 * Throws if not authorized.
 */
export function getAuthedClient() {
    if (!isAuthorized()) {
        throw new Error("Not authorized. Please complete the OAuth flow first.");
    }
    // Re-set credentials in case they were refreshed
    oauth2Client.setCredentials(storedTokens);
    return oauth2Client;
}
