const crypto = require('crypto');
import { createHttpError } from "../lib/http.js";

export const sendNotification = async (payload) => {
  const { type, to, subject, body, metadata } = payload;

  if (!type || !to || !body) {
    throw createHttpError(400, "Missing required fields: type, to, body");
  }

  console.log(`[NotificationService] Sending ${String(type).replace(/[\r\n]/g, '')} to ${String(to).replace(/[\r\n]/g, '')}...`);
  console.log(`[NotificationService] Subject: ${String(subject || "N/A").replace(/[\r\n]/g, '')}`);
  console.log(`[NotificationService] Body: ${String(body).replace(/[\r\n]/g, '')}`);

  // Simulation of sending
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    success: true,
    messageId: `msg_${crypto.randomBytes(5).toString('hex')}`,
    timestamp: new Date().toISOString(),
    type,
    to,
  };
};

export const listNotifications = async () => {
  // For now, we don't have a persistence layer as per "wag galawin ang supabase"
  // If needed, this would query the notifications table.
  return [];
};
