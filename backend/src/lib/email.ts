/**
 * Email service using Resend API (edge-compatible).
 *
 * To use: set RESEND_API_KEY in .dev.vars and wrangler secrets.
 * Get a key at https://resend.com
 */

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Absensi RBIA <onboarding@resend.dev>"; // Change to your verified domain

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(
  apiKey: string,
  options: EmailOptions
): Promise<boolean> {
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Email send failed:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}

export function scheduleReminderEmail(params: {
  teacherName: string;
  subjectName: string;
  className: string;
  scheduleTime: string;
  scheduleDay: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #F9FAFB; padding: 32px 16px; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
    <div style="background: #20B2AA; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 20px;">🎓 Absensi RBIA</h1>
    </div>
    <div style="padding: 24px;">
      <p style="color: #1A1A1A; font-size: 16px; margin: 0 0 16px;">
        Assalamu'alaikum, <strong>${params.teacherName}</strong>
      </p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Pengingat: Anda memiliki jadwal mengajar sebentar lagi.
      </p>
      <div style="background: #F0FDFC; border: 1px solid #20B2AA20; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="color: #6B7280; padding: 4px 0;">Mata Pelajaran</td>
            <td style="color: #1A1A1A; font-weight: 600; text-align: right;">${params.subjectName}</td>
          </tr>
          <tr>
            <td style="color: #6B7280; padding: 4px 0;">Kelas</td>
            <td style="color: #1A1A1A; font-weight: 600; text-align: right;">${params.className}</td>
          </tr>
          <tr>
            <td style="color: #6B7280; padding: 4px 0;">Hari & Jam</td>
            <td style="color: #1A1A1A; font-weight: 600; text-align: right;">${params.scheduleDay}, ${params.scheduleTime}</td>
          </tr>
        </table>
      </div>
      <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0;">
        Jangan lupa untuk memulai sesi dan mencatat kehadiran siswa setelah pelajaran dimulai.
      </p>
    </div>
    <div style="background: #F9FAFB; padding: 16px; text-align: center; border-top: 1px solid #E5E7EB;">
      <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
        Email ini dikirim otomatis oleh sistem Absensi RBIA
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function resetPasswordEmail(params: {
  name: string;
  resetLink: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #F9FAFB; padding: 32px 16px; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
    <div style="background: #20B2AA; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 20px;">🔐 Reset Password</h1>
    </div>
    <div style="padding: 24px;">
      <p style="color: #1A1A1A; font-size: 16px; margin: 0 0 16px;">
        Halo, <strong>${params.name}</strong>
      </p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Kami menerima permintaan untuk reset password akun Anda. Klik tombol di bawah untuk membuat password baru.
      </p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${params.resetLink}" style="display: inline-block; background: #20B2AA; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Reset Password
        </a>
      </div>
      <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
        Atau salin link berikut ke browser Anda:
      </p>
      <p style="color: #20B2AA; font-size: 12px; word-break: break-all; margin: 0 0 24px; padding: 12px; background: #F0FDFC; border-radius: 6px;">
        ${params.resetLink}
      </p>
      <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5; margin: 0;">
        Link ini berlaku selama <strong>1 jam</strong>. Jika Anda tidak meminta reset password, abaikan email ini.
      </p>
    </div>
    <div style="background: #F9FAFB; padding: 16px; text-align: center; border-top: 1px solid #E5E7EB;">
      <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
        Email ini dikirim otomatis oleh sistem Absensi RBIA
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export const DAY_LABELS: Record<string, string> = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu",
};
