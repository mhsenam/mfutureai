/* eslint-disable */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import * as https from "https";
import { IncomingMessage } from "http";
import { Firestore } from "firebase-admin/firestore";
import axios from "axios";

// Initialize Firebase Admin SDK
admin.initializeApp();

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

// Define the default bot token
const defaultBotToken = process.env.TELEGRAM_BOT_TOKEN || "";

// Define valid bot prefixes for additional security
const validBotPrefixes = ["mfuture_", "testbot_", ""];

// Define a simple fetch-like function for Telegram API calls with interactive buttons
async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  pillId: string,
  botToken: string
): Promise<void> {
  if (!botToken) {
    throw new Error("Telegram bot token not provided");
  }

  return new Promise((resolve, reject) => {
    // Create inline keyboard with buttons for user interaction, but only if pillId is not empty
    const inlineKeyboard =
      pillId && pillId !== ""
        ? {
            inline_keyboard: [
              [
                {
                  text: "✅ Taken",
                  callback_data: `taken:${pillId}:${chatId}:${new Date().toISOString()}`,
                },
                {
                  text: "⏰ Snooze 30m",
                  callback_data: `snooze:${pillId}:${chatId}:${new Date().toISOString()}`,
                },
                {
                  text: "⏭️ Skip",
                  callback_data: `skip:${pillId}:${chatId}:${new Date().toISOString()}`,
                },
              ],
            ],
          }
        : undefined; // Don't include buttons if no pillId is provided

    const data = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
      ...(inlineKeyboard && { reply_markup: inlineKeyboard }),
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
      // @ts-ignore
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
                // @ts-ignore
                const userDoc = await db
                  .collection("users")
                  .doc(reminder.userId)
                  .get();
                const userData = userDoc.data() as User | undefined;

                if (userData?.currentBotId) {
                  // Get the active bot data
                  // @ts-ignore
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
                        reminder.id,
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
                    reminder.id,
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

// Update the telegramWebhook function to ensure we're correctly looking up the user by Firebase UID
export const telegramWebhook = functions.https.onRequest(async (req, res) => {
  console.log("Telegram webhook called with data:", JSON.stringify(req.body));

  // Verify this is a POST request from Telegram
  if (req.method !== "POST") {
    console.error("Invalid request method:", req.method);
    res.status(400).send("Invalid request method");
    return;
  }

  try {
    // Handle message commands (e.g. /start)
    if (req.body.message && req.body.message.text) {
      const chatId = req.body.message.chat.id.toString();
      const messageText = req.body.message.text;

      console.log(`Received message: ${messageText} from chat ID: ${chatId}`);
      console.log(
        "Message sender info:",
        JSON.stringify(req.body.message.from)
      );

      // Extract user ID from /start command
      if (messageText.startsWith("/start")) {
        // Improved extraction with better logging
        const parts = messageText.split(" ");
        console.log("Message parts:", parts);

        if (parts.length < 2) {
          console.error(
            "Invalid start command format, missing user ID:",
            messageText
          );
          await sendTelegramMessage(
            chatId,
            "⚠️ Missing user ID. Please try connecting again from the app.",
            "",
            defaultBotToken
          );
          res.status(200).send("OK");
          return;
        }

        const userId = parts[1];
        console.log("Extracted user ID:", userId);

        // Check if this is a valid bot token prefix
        const botPrefix = parts[2] || ""; // Optional bot token prefix
        if (botPrefix && !validBotPrefixes.includes(botPrefix)) {
          console.error("Invalid bot prefix:", botPrefix);
          await sendTelegramMessage(
            chatId,
            "⚠️ Invalid bot configuration. Please try connecting again from the app.",
            "",
            defaultBotToken
          );
          res.status(200).send("OK");
          return;
        }

        try {
          // Improved user lookup with detailed logging
          console.log(`Looking up user document for Firebase UID: ${userId}`);
          const userSnapshot = await admin
            .firestore()
            .collection("users")
            .doc(userId)
            .get();

          if (!userSnapshot.exists) {
            console.error(
              `User with Firebase UID ${userId} not found in Firestore`
            );
            await sendTelegramMessage(
              chatId,
              "⚠️ User not found. Please try connecting again from the app.",
              "",
              defaultBotToken
            );
            res.status(200).send("OK");
            return;
          }

          // Update the user's document with the Telegram chat ID
          console.log(
            `Updating user ${userId} with Telegram chat ID: ${chatId}`
          );
          await admin
            .firestore()
            .collection("users")
            .doc(userId)
            .update({
              telegramChatId: chatId,
              telegramUsername: req.body.message.from?.username || "",
              telegramUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

          console.log("User document updated successfully");

          // Send a confirmation message
          await sendTelegramMessage(
            chatId,
            "✅ Successfully connected your Telegram account! You will now receive pill reminders here.",
            "",
            botPrefix ? `${botPrefix}${defaultBotToken}` : defaultBotToken
          );

          console.log("Connection complete and confirmation sent");
          res.status(200).send("OK");
          return;
        } catch (dbError) {
          console.error("Database error during user connection:", dbError);
          await sendTelegramMessage(
            chatId,
            "⚠️ Server error while connecting. Please try again later.",
            "",
            defaultBotToken
          );
          res.status(200).send("OK");
          return;
        }
      }
    }

    // Handle callback queries from inline keyboard buttons
    if (req.body.callback_query) {
      console.log(
        "Received callback query:",
        JSON.stringify(req.body.callback_query)
      );

      const callbackQuery = req.body.callback_query;
      const chatId = callbackQuery.message.chat.id.toString();

      // Parse the callback data
      // Format: action:pillId:userId:reminderTime
      try {
        if (!callbackQuery.data) {
          throw new Error("Callback data is missing");
        }

        const callbackData = callbackQuery.data.split(":");
        if (callbackData.length < 4) {
          throw new Error("Invalid callback data format");
        }

        const [action, pillId, userId, reminderTime] = callbackData;
        console.log(
          `Processing ${action} for pill ${pillId} of user ${userId}`
        );

        // Get user doc to retrieve the bot token
        const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(userId)
          .get();
        if (!userDoc.exists) {
          throw new Error(`User ${userId} not found`);
        }

        const userData = userDoc.data() as User;
        if (!userData.currentBotId) {
          throw new Error("User has no bot configured");
        }

        // Get the bot token
        const botDoc = await admin
          .firestore()
          .collection("telegramBots")
          .doc(userData.currentBotId)
          .get();
        if (!botDoc.exists) {
          throw new Error(`Bot ${userData.currentBotId} not found`);
        }

        const botData = botDoc.data() as TelegramBot;

        // Update pill reminder history in Firestore
        const now = new Date();
        const historyRef = admin
          .firestore()
          .collection("pillReminderHistory")
          .doc();

        let responseMessage = "";

        switch (action) {
          case "taken":
            await historyRef.set({
              pillId,
              userId,
              action: "taken",
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              scheduledTime: reminderTime,
            });

            responseMessage =
              "✅ Pill marked as taken. Great job taking care of your health!";
            break;

          case "snooze":
            await historyRef.set({
              pillId,
              userId,
              action: "snoozed",
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              scheduledTime: reminderTime,
            });

            // Send a new reminder in 30 minutes
            const snoozeTime = new Date(now.getTime() + 30 * 60 * 1000);
            responseMessage = `⏰ Reminder snoozed. We'll remind you again at ${snoozeTime.toLocaleTimeString()}.`;

            // Schedule a delayed notification
            setTimeout(async () => {
              try {
                const pillDoc = await admin
                  .firestore()
                  .collection("pillReminders")
                  .doc(pillId)
                  .get();
                if (pillDoc.exists) {
                  const pillData = pillDoc.data() as PillReminder;
                  const message = `🔔 Snoozed Pill Reminder\n\nTime to take your medicine: ${pillData.name}\n\nStay healthy!`;

                  await sendTelegramMessage(
                    chatId,
                    message,
                    pillId,
                    botData.botToken || ""
                  );
                }
              } catch (error) {
                console.error("Error sending snoozed reminder:", error);
              }
            }, 30 * 60 * 1000);
            break;

          case "skip":
            await historyRef.set({
              pillId,
              userId,
              action: "skipped",
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              scheduledTime: reminderTime,
            });

            responseMessage = "⏭️ Dose skipped. Your choice has been recorded.";
            break;

          default:
            responseMessage = "❓ Unknown action. Please try again.";
        }

        // Send confirmation message
        await sendTelegramMessage(
          chatId,
          responseMessage,
          "",
          botData.botToken || ""
        );

        // Answer the callback query to remove the loading state
        const callbackUrl = `https://api.telegram.org/bot${botData.botToken}/answerCallbackQuery?callback_query_id=${callbackQuery.id}`;
        await axios.get(callbackUrl);
      } catch (error) {
        console.error("Error processing callback:", error);
        await sendTelegramMessage(
          chatId,
          "❌ An error occurred while processing your request. Please try again later.",
          "",
          defaultBotToken
        );
      }

      res.status(200).send("OK");
      return;
    }
  } catch (error) {
    console.error("Error processing Telegram webhook:", error);
    res.status(500).send("Error processing request");
    return;
  }

  res.status(200).send("OK");
});
