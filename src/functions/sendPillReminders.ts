import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import * as https from "https";
import { IncomingMessage } from "http";

// Initialize Firebase Admin SDK
try {
  admin.initializeApp();
} catch (e) {
  console.log("Firebase admin initialization error", e);
}

// Define the PillReminder interface to match the Firestore document structure
interface PillReminder {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "specific_date";
  time: string;
  daysOfWeek?: string[];
  specificDate?: string | null;
  userId: string;
  createdAt: string;
  notificationEmail: string;
  sendNotifications: boolean;
  // New fields for Telegram
  telegramChatId?: string;
  useTelegramNotifications: boolean;
}

// Define User interface
interface User {
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramUsername?: string;
  currentBotId?: string;
}

// Define TelegramBot interface
interface TelegramBot {
  id: string;
  userId: string;
  botToken: string;
  botName: string;
  chatId?: string;
  username?: string;
  createdAt: string;
  isActive: boolean;
}

// Configure nodemailer with your email service credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().email?.user || "",
    pass: functions.config().email?.password || "",
  },
});

// Define a simple fetch-like function for Telegram API calls
async function sendTelegramMessage(
  chatId: string,
  text: string,
  botToken: string
): Promise<void> {
  if (!botToken) {
    throw new Error("Telegram bot token not provided");
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: chatId,
      text: text,
    });

    const options = {
      hostname: "api.telegram.org",
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = https.request(options, (res: IncomingMessage) => {
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        return reject(
          new Error(
            `Telegram API error: Status code ${res.statusCode || "unknown"}`
          )
        );
      }

      res.on("data", () => {});
      res.on("end", () => {
        resolve();
      });
    });

    req.on("error", (error: Error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

export const sendPillReminders = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });

    try {
      // Get all pill reminders
      const db = admin.firestore();
      // @ts-expect-error - Firestore types not properly recognized
      const pillsSnapshot = await db.collection("pillReminders").get();

      for (const doc of pillsSnapshot.docs) {
        const reminder = doc.data() as PillReminder;
        const reminderTime = reminder.time.split(":");
        const reminderHour = parseInt(reminderTime[0]);
        const reminderMinute = parseInt(reminderTime[1]);

        // Check if it's time to send the reminder
        if (
          reminderHour === currentHour &&
          Math.abs(reminderMinute - currentMinute) < 5 // Within 5 minutes of the scheduled time
        ) {
          // Check frequency conditions
          let shouldSendReminder = false;

          switch (reminder.frequency) {
            case "daily":
              shouldSendReminder = true;
              break;
            case "weekly":
              if (reminder.daysOfWeek && Array.isArray(reminder.daysOfWeek)) {
                shouldSendReminder = reminder.daysOfWeek.includes(currentDay);
              }
              break;
            case "specific_date":
              if (reminder.specificDate) {
                const specificDate = new Date(reminder.specificDate);
                shouldSendReminder =
                  specificDate.getDate() === now.getDate() &&
                  specificDate.getMonth() === now.getMonth() &&
                  specificDate.getFullYear() === now.getFullYear();
              }
              break;
          }

          if (shouldSendReminder && reminder.sendNotifications) {
            try {
              // Send email notification
              if (reminder.notificationEmail) {
                const mailOptions = {
                  from: functions.config().email?.user || "",
                  to: reminder.notificationEmail,
                  subject: "Pill Reminder",
                  html: `
                    <h2>Time to Take Your Medicine</h2>
                    <p>This is a reminder to take your medicine: ${reminder.name}</p>
                    <p>Scheduled time: ${reminder.time}</p>
                    <br>
                    <p>Stay healthy!</p>
                    <p>- Your FitAmIn Team</p>
                  `,
                };

                await transporter.sendMail(mailOptions);
                console.log(
                  `Reminder email sent to ${reminder.notificationEmail} for ${reminder.name}`
                );
              }

              // Send Telegram notification if enabled
              if (
                reminder.useTelegramNotifications &&
                reminder.telegramChatId
              ) {
                // Get the user's data from Firestore
                // @ts-expect-error - Firestore types not properly recognized
                const userDoc = await db
                  .collection("users")
                  .doc(reminder.userId)
                  .get();
                const userData = userDoc.data() as User | undefined;

                if (userData?.currentBotId) {
                  // Get the active bot data
                  // @ts-expect-error - Firestore types not properly recognized
                  const botDoc = await db
                    .collection("telegramBots")
                    .doc(userData.currentBotId)
                    .get();

                  if (botDoc.exists) {
                    const botData = botDoc.data() as TelegramBot;

                    if (botData.botToken && botData.chatId) {
                      const message = `🔔 Pill Reminder\n\nTime to take your medicine: ${reminder.name}\nScheduled time: ${reminder.time}\n\nStay healthy!`;

                      await sendTelegramMessage(
                        botData.chatId,
                        message,
                        botData.botToken
                      );

                      console.log(
                        `Reminder telegram message sent to chat ID ${botData.chatId} for ${reminder.name}`
                      );
                    } else {
                      console.error(
                        `Bot token or chat ID not found for bot ${userData.currentBotId}`
                      );
                    }
                  } else {
                    console.error(
                      `Bot not found for ID ${userData.currentBotId}`
                    );
                  }
                } else if (userData?.telegramBotToken) {
                  // Fallback to the user's bot token (for backward compatibility)
                  const message = `🔔 Pill Reminder\n\nTime to take your medicine: ${reminder.name}\nScheduled time: ${reminder.time}\n\nStay healthy!`;

                  await sendTelegramMessage(
                    reminder.telegramChatId,
                    message,
                    userData.telegramBotToken
                  );

                  console.log(
                    `Reminder telegram message sent to chat ID ${reminder.telegramChatId} for ${reminder.name}`
                  );
                } else {
                  console.error(
                    `No bot token found for user ${reminder.userId}`
                  );
                }
              }
            } catch (error: unknown) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
              console.error("Error sending notifications:", errorMessage);
            }
          }
        }
      }

      return null;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error sending reminders:", errorMessage);
      return null;
    }
  });

// Add a new function to handle Telegram webhook
// @ts-expect-error - Firebase Functions types not properly recognized
export const telegramWebhook = functions.https.onRequest(async (req, res) => {
  // Verify the request is from Telegram
  if (req.method !== "POST") {
    res.status(400).send("Only POST requests are accepted");
    return;
  }

  const update = req.body;

  // Handle /start command with parameters
  if (
    update.message &&
    update.message.text &&
    update.message.text.startsWith("/start")
  ) {
    const params = update.message.text.substring(7).split("_");
    if (params.length === 2) {
      const [userId, botTokenPrefix] = params; // Extract userId and bot token prefix

      // Store the chat ID in the user's document
      try {
        // Get the user document to retrieve the current bot ID
        const db = admin.firestore();
        // @ts-expect-error - Firestore types not properly recognized
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data() as User | undefined;

        if (!userData || !userData.currentBotId) {
          console.error(`No current bot ID found for user ${userId}`);
          res.status(400).send("Bot not found");
          return;
        }

        // Get the bot document
        // @ts-expect-error - Firestore types not properly recognized
        const botDoc = await db
          .collection("telegramBots")
          .doc(userData.currentBotId)
          .get();

        if (!botDoc.exists) {
          console.error(`Bot not found for ID ${userData.currentBotId}`);
          res.status(400).send("Bot not found");
          return;
        }

        const botData = botDoc.data() as TelegramBot;

        // Verify that the bot token prefix matches
        if (!botData.botToken || !botData.botToken.startsWith(botTokenPrefix)) {
          console.error(
            `Bot token prefix mismatch for bot ${userData.currentBotId}`
          );
          res.status(400).send("Invalid bot token");
          return;
        }

        // Update the bot document with the chat ID
        // @ts-expect-error - Firestore types not properly recognized
        await db
          .collection("telegramBots")
          .doc(userData.currentBotId)
          .update({
            chatId: update.message.chat.id,
            username: update.message.chat.username || "",
          });

        // Update the user document with the chat ID
        // @ts-expect-error - Firestore types not properly recognized
        await db.collection("users").doc(userId).update({
          telegramChatId: update.message.chat.id,
        });

        // Send confirmation message using the bot's token
        await sendTelegramMessage(
          update.message.chat.id,
          "✅ Your Telegram account has been successfully connected to FitAmIn! You will now receive pill reminders here.",
          botData.botToken
        );

        res.status(200).send("OK");
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Error storing Telegram chat ID:", errorMessage);
        res.status(500).send("Error processing request");
        return;
      }
    } else {
      res.status(400).send("Invalid parameters");
    }
  } else {
    res.status(200).send("OK");
  }
});
