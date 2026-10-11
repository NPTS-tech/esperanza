import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

// Transactional email via Amazon SES. Credentials come from the ECS task role
// (default AWS SDK chain). Disabled when EMAIL_FROM is unset, e.g. local dev.
const from = process.env.EMAIL_FROM;
const reply_to = process.env.EMAIL_REPLY_TO;

export const email_enabled = Boolean(from);

const ses = email_enabled
    ? new SESv2Client({ region: process.env.SES_REGION ?? process.env.AWS_REGION ?? "us-east-2" })
    : null;

export async function send_email(to: string, subject: string, text: string): Promise<boolean> {
    if (!ses) return false;

    await ses.send(
        new SendEmailCommand({
            FromEmailAddress: from,
            ReplyToAddresses: reply_to ? [reply_to] : undefined,
            Destination: { ToAddresses: [to] },
            Content: {
                Simple: {
                    Subject: { Data: subject, Charset: "UTF-8" },
                    Body: { Text: { Data: text, Charset: "UTF-8" } },
                },
            },
        }),
    );
    return true;
}
