/* eslint-disable */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import * as https from "https";
import { IncomingMessage } from "http";
import { Firestore } from "firebase-admin/firestore";

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

// Define a simple fetch-like function for Telegram API calls with interactive buttons
async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  botToken: string,
  pillId?: string
): Promise<void> {
  if (!botToken) {
    throw new Error("Telegram bot token not provided");
  }

  return new Promise((resolve, reject) => {
    // Create inline keyboard with buttons for user interaction
    const inlineKeyboard = pillId
      ? {
          inline_keyboard: [
            [
              {
                text: "✅ Taken",
                callback_data: `taken_${pillId}`,
              },
              {
                text: "⏰ Snooze 15m",
                callback_data: `snooze_${pillId}`,
              },
              {
                text: "⏭️ Skip",
                callback_data: `skip_${pillId}`,
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
                        botData.botToken,
                        reminder.id
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
                    userData.telegramBotToken,
                    reminder.id
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

// Update the telegramWebhook function to handle direct user auth
export const telegramWebhook = functions.https.onRequest(async (req, res) => {
  // Ensure this is a POST request from Telegram
  if (req.method !== "POST") {
    console.error("Invalid request method");
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const update = req.body;
    console.log("Received Telegram webhook:", JSON.stringify(update));

    // Get Firestore database reference
    const db = admin.firestore();

    // Handle the /start command which includes user ID
    if (
      update.message &&
      update.message.text &&
      update.message.text.startsWith("/start")
    ) {
      console.log("Processing /start command");
      const startCommand = update.message.text;
      const userId = startCommand.split(" ")[1]; // Extract userId from "/start {userId}"

      if (!userId) {
        console.error("Missing user ID in start command");
        res.status(200).send("Missing user ID");
        return;
      }

      console.log(`Connecting Telegram user to app user ID: ${userId}`);

      // Check if the user exists in Firestore
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        console.error(`User ${userId} not found in Firestore`);

        // Send an error message to the user
        await sendTelegramMessage(
          update.message.chat.id,
          "⚠️ User not found. Please try connecting again from the app.",
          process.env.TELEGRAM_BOT_TOKEN || "",
          ""
        );

        res.status(200).send("User not found");
        return;
      }

      // Get the chat ID from the update
      const chatId = update.message.chat.id;

      // Update the user document with the Telegram chat ID
      await db.collection("users").doc(userId).update({
        telegramChatId: chatId.toString(),
        useTelegramNotifications: true,
      });

      console.log(`Updated user ${userId} with Telegram chat ID ${chatId}`);

      // Send a confirmation message to the user
      await sendTelegramMessage(
        chatId,
        "✅ Your Telegram account has been successfully connected to FitAmIn! You will now receive pill reminders here.",
        process.env.TELEGRAM_BOT_TOKEN || "",
        ""
      );

      res.status(200).send("OK");
      return;
    }

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      // Process the callback as before...
      console.log("Processing callback query:", update.callback_query);
      const callbackData = update.callback_query.data;
      const chatId = update.callback_query.message.chat.id;

      // Find which action the user took (taken, snooze, skip)
      const [action, pillId] = callbackData.split("_");

      if (!action || !pillId) {
        console.error("Invalid callback data format");
        res.status(200).json({});
        return;
      }

      // Find the user by chat ID
      const usersSnapshot = await db
        .collection("users")
        .where("telegramChatId", "==", chatId.toString())
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        console.error(`No user found with chat ID ${chatId}`);
        res.status(200).json({});
        return;
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data() as User;
      const userId = userDoc.id;

      // Get the pill reminder
      const pillDoc = await db.collection("pillReminders").doc(pillId).get();

      if (!pillDoc.exists) {
        console.error(`Pill with ID ${pillId} not found`);
        res.status(200).json({});
        return;
      }

      const reminder = pillDoc.data() as PillReminder;

      if (reminder.userId !== userId) {
        console.error("User ID mismatch. Possible security issue.");
        res.status(200).json({});
        return;
      }

      // Create a history entry
      await db.collection("pillHistory").add({
        pillId: pillId,
        userId: userId,
        action: action,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        telegramUserId: update.callback_query.from.id.toString(),
      });

      // Send a confirmation message
      let responseText = "";

      if (action === "taken") {
        responseText = `✅ Great! You've marked "${reminder.name}" as taken.`;
      } else if (action === "snooze") {
        responseText = `⏰ You've snoozed the reminder for "${reminder.name}". We'll remind you again in 15 minutes.`;

        // Schedule a follow-up reminder in 15 minutes
        setTimeout(async () => {
          try {
            const reminderText = `🔔 SNOOZED REMINDER\n\nIt's been 15 minutes! Don't forget to take your medicine: ${reminder.name}`;

            // Send a follow-up message
            await sendTelegramMessage(
              chatId,
              reminderText,
              process.env.TELEGRAM_BOT_TOKEN || "",
              pillId
            );
          } catch (error) {
            console.error("Error sending snoozed reminder:", error);
          }
        }, 15 * 60 * 1000); // 15 minutes
      } else if (action === "skip") {
        responseText = `⏭️ You've skipped the dose for "${reminder.name}".`;
      }

      // Answer the callback query to remove the loading state
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            callback_query_id: update.callback_query.id,
          }),
        }
      );

      // Send the confirmation message
      await sendTelegramMessage(
        chatId,
        responseText,
        process.env.TELEGRAM_BOT_TOKEN || "",
        ""
      );

      res.status(200).json({});
      return;
    }

    // Handle other message types
    res.status(200).send("OK");
    return;
  } catch (error) {
    console.error("Error processing Telegram webhook:", error);
    res.status(500).send("Internal Server Error");
    return;
  }
});
