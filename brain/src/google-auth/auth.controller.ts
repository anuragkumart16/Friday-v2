import { Request, Response, NextFunction } from "express";
import ApiResponse from "../utils/response.util";
import { getAuthUrl, handleAuthCallback, isAuthorized, revokeAuth } from "./auth.service";


/**
 * GET /auth/url
 * Returns the OAuth2 authorization URL.
 * Pass ?redirect=true to auto-redirect the user.
 */
export const getAuthUrlController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("getAuthUrlController is being run!");
        const authUrl = getAuthUrl();

        if (req.query.redirect === "true") {
            return res.redirect(authUrl);
        }

        ApiResponse(res, 200, "Authorization URL generated", { authUrl });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /auth/callback
 * Handles the OAuth2 callback from Google.
 */
export const authCallbackController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const code = req.query.code as string;

        if (!code) {
            return ApiResponse(res, 400, "Authorization code is required");
        }

        const tokens = await handleAuthCallback(code);
        const dashboardUrl = process.env.DASHBOARD_URL || "http://localhost:3000";
        res.redirect(`${dashboardUrl}/google-auth?authorized=true`);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /auth/status
 * Returns the current authorization status.
 */
export const authStatusController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authorized = isAuthorized();
        ApiResponse(res, 200, "Authorization status", { authorized });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /auth/revoke
 * Revokes the current OAuth2 authorization.
 */
export const revokeAuthController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await revokeAuth();
        ApiResponse(res, 200, "Authorization revoked", { authorized: false });
    } catch (error) {
        next(error);
    }
};
