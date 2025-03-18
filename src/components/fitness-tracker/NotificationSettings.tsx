import React, { useState } from "react";

interface NotificationSettingsProps {
  sendNotifications: boolean;
  toggleNotifications: () => void;
  notificationEmail: string;
  setNotificationEmail: (email: string) => void;
  telegramChatId?: string;
  useTelegramNotifications: boolean;
  toggleTelegramNotifications: () => void;
  handleTelegramAuth: () => void;
  telegramConnecting?: boolean;
  showBotHistory?: boolean;
  toggleBotHistory?: () => void;
  debugTelegramConnection?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  sendNotifications,
  toggleNotifications,
  notificationEmail,
  setNotificationEmail,
  telegramChatId,
  useTelegramNotifications,
  toggleTelegramNotifications,
  handleTelegramAuth,
  telegramConnecting = false,
  showBotHistory = false,
  toggleBotHistory,
  debugTelegramConnection,
}) => {
  const [telegramUserId, setTelegramUserId] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const handleConnect = () => {
    if (!telegramUserId.trim()) {
      // Show error message if user ID is empty
      alert("Please enter your Telegram User ID");
      return;
    }

    setIsConnecting(true);

    // Call the auth function with the user-provided Telegram ID
    handleTelegramAuth();

    // Reset connecting state after a delay (in case of failure)
    setTimeout(() => {
      setIsConnecting(false);
    }, 5000);
  };

  // Use the external telegramConnecting state if provided
  const connecting = telegramConnecting || isConnecting;

  return (
    <div className="space-y-4 md:col-span-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-base font-medium text-gray-700 dark:text-gray-200">
            Notification Settings
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Get reminders when it&apos;s time to take your pills
          </p>
        </div>
        <button
          type="button"
          onClick={toggleNotifications}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            sendNotifications
              ? "bg-blue-600 dark:bg-blue-500"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
          aria-pressed={sendNotifications}
          aria-labelledby="notifications-label"
        >
          <span className="sr-only">
            {sendNotifications ? "Enable" : "Disable"} notifications
          </span>
          <span
            className={`${
              sendNotifications ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out`}
          />
        </button>
      </div>

      {sendNotifications && (
        <div className="space-y-4 mt-4">
          {/* Notification Methods */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notification Methods
            </label>

            {/* Hidden input for email - keeps functionality but is not visible */}
            <input
              type="hidden"
              id="notificationEmail"
              name="notificationEmail"
              value={notificationEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNotificationEmail(e.target.value)
              }
            />

            {/* Telegram Notification */}
            <div className="flex flex-col p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-600 dark:text-blue-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Telegram
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {telegramChatId
                        ? "Telegram notifications enabled"
                        : "Connect your Telegram account to receive notifications"}
                    </p>
                  </div>
                </div>

                {telegramChatId ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Connected
                    </span>
                    <button
                      type="button"
                      onClick={toggleTelegramNotifications}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        useTelegramNotifications
                          ? "bg-blue-600 dark:bg-blue-500"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <span className="sr-only">
                        Toggle Telegram notifications
                      </span>
                      <span
                        className={`${
                          useTelegramNotifications
                            ? "translate-x-6"
                            : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out`}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {connecting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-xs text-blue-600">
                          Connecting...
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnect}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        disabled={!telegramUserId.trim()}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!telegramChatId && !connecting && (
                <div className="mt-3 space-y-3">
                  <div className="relative">
                    <label
                      htmlFor="telegramUserId"
                      className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Your Telegram User ID
                    </label>
                    <input
                      type="text"
                      id="telegramUserId"
                      name="telegramUserId"
                      value={telegramUserId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTelegramUserId(e.target.value)
                      }
                      placeholder="Enter your Telegram User ID (e.g. 627097366)"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-lighter text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    1. Enter your Telegram User ID above
                    <br />
                    2. Click Connect to open Telegram and automatically send the
                    command
                    <br />
                    3. Confirm the command in Telegram to complete the
                    connection
                  </p>
                </div>
              )}

              {connecting && (
                <div className="mt-3 py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Waiting for Telegram connection... Confirm the command in
                    Telegram if needed.
                  </p>

                  <div className="mt-2 text-xs">
                    <p className="text-gray-600 dark:text-gray-400">
                      If Telegram didn&apos;t open automatically or the command
                      wasn&apos;t sent, click:
                    </p>
                    <div className="flex flex-col gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          // Open Telegram with the start command pre-filled
                          window.open(
                            `https://t.me/mfuturetestbot?start=${telegramUserId}`,
                            "_blank"
                          );
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Send Command to Bot
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Manually check connection status
                          handleTelegramAuth();
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Check Connection Status
                      </button>
                      <div className="text-xs text-amber-600 mt-2">
                        ⚠️ If you already sent the command in Telegram and saw a
                        success message, click &quot;Check Connection
                        Status&quot; to refresh the UI.
                      </div>

                      <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          If you&apos;re still having trouble, try this manual
                          method:
                        </p>
                        <ol className="list-decimal pl-4 text-gray-600 dark:text-gray-400 space-y-1">
                          <li>
                            Send the command{" "}
                            <code>/start {telegramUserId}</code> to the bot
                          </li>
                          <li>
                            When the bot replies with success, check the browser
                            console (F12) for logs
                          </li>
                          <li>
                            Look for &quot;Found user with telegramChatId&quot;
                            message and the ID value
                          </li>
                          <li>
                            Reload the page to see if it recognizes the
                            connection
                          </li>
                        </ol>

                        {debugTelegramConnection && (
                          <button
                            type="button"
                            onClick={debugTelegramConnection}
                            className="mt-3 text-white bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded-md text-xs"
                          >
                            Debug Connection (Last Resort)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bot History Button */}
              {toggleBotHistory && telegramChatId && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={toggleBotHistory}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showBotHistory ? "Hide Bot History" : "View Bot History"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
