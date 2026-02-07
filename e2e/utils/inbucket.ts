/**
 * Email Inbox Helper for E2E Testing (Supabase Local)
 *
 * Supabase Local now provides Mailpit as the local mail capture service.
 * This helper polls the Mailpit HTTP API to fetch and parse emails sent by Supabase Auth.
 *
 * Note:
 * - The file name is kept as `inbucket.ts` to avoid churn in test imports.
 * - The underlying implementation targets Mailpit (not Inbucket).
 *
 * Prerequisites:
 * - Supabase Local must be running (npm run supabase:start)
 * - Mailpit UI available at http://127.0.0.1:54324
 * - Mailpit API available at http://127.0.0.1:54324/api/v1
 */

const EMAIL_API_URL =
  process.env.INBUCKET_API_URL || "http://127.0.0.1:54324/api/v1";

interface MailpitMessageSummary {
  ID: string;
  Created: string;
  From: {
    Address: string;
    Name: string;
  };
  To: Array<{
    Address: string;
    Name: string;
  }>;
  Subject: string;
}

interface MailpitMessagesSummary {
  messages: MailpitMessageSummary[];
  total: number;
  unread: number;
  count?: number;
  start: number;
}

interface MailpitMessage {
  ID: string;
  Subject: string;
  Text: string;
  HTML: string;
  To: Array<{
    Address: string;
    Name: string;
  }>;
  From: {
    Address: string;
    Name: string;
  };
}

function messageIsForRecipient(
  message: { To?: Array<{ Address?: string }> },
  email: string
): boolean {
  const recipients = message.To ?? [];
  return recipients.some(
    (r) => r.Address?.toLowerCase() === email.toLowerCase()
  );
}

async function listMessages(limit = 50): Promise<MailpitMessagesSummary> {
  const response = await fetch(
    `${EMAIL_API_URL}/messages?start=0&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to list emails: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as MailpitMessagesSummary;
}

/**
 * Wait for an email to arrive in Inbucket for the specified recipient
 *
 * @param email - Recipient email address
 * @param timeoutMs - Maximum time to wait for email (default: 10000ms)
 * @param pollIntervalMs - How often to check for email (default: 500ms)
 * @returns The message ID of the received email
 */
export async function waitForEmail(
  email: string,
  timeoutMs = 10000,
  pollIntervalMs = 500
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const summary = await listMessages(50);
      const matching = summary.messages.filter((m) =>
        messageIsForRecipient(m, email)
      );

      if (matching.length > 0) {
        // Return the most recent matching message
        const sorted = matching.sort(
          (a, b) =>
            new Date(b.Created).getTime() - new Date(a.Created).getTime()
        );
        return sorted[0].ID;
      }
    } catch {
      // Ignore fetch errors and continue polling
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(
    `Timeout: No email received for ${email} after ${timeoutMs}ms`
  );
}

/**
 * Get email content from Inbucket
 *
 * @param email - Recipient email address
 * @param messageId - Message ID from waitForEmail
 * @returns Email body (text and HTML)
 */
export async function getEmailContent(
  email: string,
  messageId: string
): Promise<MailpitMessage> {
  void email;
  const response = await fetch(`${EMAIL_API_URL}/message/${messageId}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch email: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as MailpitMessage;
}

/**
 * Extract password reset link from Supabase recovery email
 *
 * @param emailBody - Email content from getEmailContent
 * @returns The reset link URL
 */
export function extractResetLink(emailBody: MailpitMessage): string {
  const text = emailBody.Text || emailBody.HTML;

  // Supabase reset links follow pattern: http://localhost:3000/...#access_token=...&type=recovery
  const resetLinkMatch = text.match(
    /https?:\/\/[^\s]+(?:#|\?)[^\s]*type=recovery[^\s]*/
  );

  if (!resetLinkMatch) {
    throw new Error("No reset link found in email body");
  }

  return resetLinkMatch[0];
}

/**
 * Wait for password reset email and extract the reset link
 *
 * Convenience function that combines waitForEmail, getEmailContent, and extractResetLink
 *
 * @param email - Recipient email address
 * @param timeoutMs - Maximum time to wait for email (default: 10000ms)
 * @returns The password reset link
 */
export async function waitForResetEmail(
  email: string,
  timeoutMs = 10000
): Promise<string> {
  // Wait for email to arrive
  const messageId = await waitForEmail(email, timeoutMs);

  // Get email content
  const emailBody = await getEmailContent(email, messageId);

  // Extract reset link
  return extractResetLink(emailBody);
}

/**
 * Clear all emails for a recipient (cleanup helper)
 *
 * @param email - Recipient email address
 */
export async function clearMailbox(email: string): Promise<void> {
  try {
    const summary = await listMessages(200);
    const ids = summary.messages
      .filter((m) => messageIsForRecipient(m, email))
      .map((m) => m.ID);

    if (ids.length === 0) {
      return;
    }

    const response = await fetch(`${EMAIL_API_URL}/messages`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ IDs: ids }),
    });

    if (!response.ok) {
      console.warn(`Failed to clear mailbox: ${response.statusText}`);
    }
  } catch {
    // Ignore errors - mailbox might not exist yet
  }
}
