"use client";

import { useEffect, useState } from "react";

const BRAIN_URL = process.env.NEXT_PUBLIC_BRAIN_URL || "http://localhost:5000";

export default function GoogleAuthPage() {
    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState(false);

    const checkAuthStatus = async () => {
        try {
            const res = await fetch(`${BRAIN_URL}/api/v1/google-auth/auth/status`, {
                credentials: "include",
            });
            const data = await res.json();
            setAuthorized(data.data?.authorized ?? false);
        } catch {
            setAuthorized(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const handleConnect = () => {
        // Redirect to brain's auth URL endpoint which will redirect to Google
        window.location.href = `${BRAIN_URL}/api/v1/google-auth/auth/url?redirect=true`;
    };

    const handleRevoke = async () => {
        setRevoking(true);
        try {
            await fetch(`${BRAIN_URL}/api/v1/google-auth/auth/revoke`, {
                method: "POST",
                credentials: "include",
            });
            setAuthorized(false);
        } catch {
            console.error("Failed to revoke authorization");
        } finally {
            setRevoking(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
                <h1 className="mb-2 text-2xl font-semibold text-zinc-50">
                    Google Account
                </h1>
                <p className="mb-8 text-sm text-zinc-400">
                    Connect your Google account to enable Google Tasks integration.
                </p>

                {loading ? (
                    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/50 px-5 py-4">
                        <div className="h-3 w-3 animate-pulse rounded-full bg-zinc-500" />
                        <span className="text-sm text-zinc-400">Checking connection status...</span>
                    </div>
                ) : authorized ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-5 py-4">
                            <div className="h-3 w-3 rounded-full bg-emerald-400" />
                            <span className="text-sm font-medium text-emerald-300">Connected</span>
                        </div>
                        <button
                            onClick={handleRevoke}
                            disabled={revoking}
                            className="w-full cursor-pointer rounded-xl border border-red-900/50 bg-red-950/20 px-5 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {revoking ? "Revoking..." : "Disconnect Google Account"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/50 px-5 py-4">
                            <div className="h-3 w-3 rounded-full bg-zinc-500" />
                            <span className="text-sm text-zinc-400">Not connected</span>
                        </div>
                        <button
                            onClick={handleConnect}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Connect Google Account
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
