import { SignJWT, jwtVerify } from "jose";

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: string;
}

export async function signToken(payload: JWTPayload, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder.encode(secret));
}

export async function verifyToken(token: string, secret: string): Promise<JWTPayload> {
  const encoder = new TextEncoder();
  const { payload } = await jwtVerify(token, encoder.encode(secret));
  return payload as unknown as JWTPayload;
}
