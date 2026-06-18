/**
 * Cloudflare Turnstile verification.
 * https://developers.cloudflare.com/turnstile/
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstile(
  secretKey: string,
  token: string,
  ip?: string
): Promise<boolean> {
  if (!secretKey || !token) {
    return false;
  }

  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token);
  if (ip) {
    formData.append("remoteip", ip);
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
    });

    const data: TurnstileResponse = await res.json();

    if (!data.success) {
      console.error("Turnstile verification failed:", data["error-codes"]);
    }

    return data.success;
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return false;
  }
}
