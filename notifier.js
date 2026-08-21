const https = require("https");

/**
 * Send a Telegram message.
 */
function sendTelegram(message) {
  return new Promise((resolve) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      resolve({
        sent: false,
        error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
      });
      return;
    }

    const data = JSON.stringify({
      chat_id: chatId,
      text: message,
      disable_web_page_preview: false,
    });

    const request = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${token}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (response) => {
        let body = "";

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          if (
            response.statusCode >= 200 &&
            response.statusCode < 300
          ) {
            resolve({
              sent: true,
            });
          } else {
            resolve({
              sent: false,
              error: `Telegram HTTP ${response.statusCode}: ${body}`,
            });
          }
        });
      }
    );

    request.on("error", (error) => {
      resolve({
        sent: false,
        error: error.message,
      });
    });

    request.write(data);
    request.end();
  });
}


/**
 * Format a product restock alert.
 */
function formatProduct(product) {
  const retailer =
    product.retailer ||
    product.store ||
    product.source ||
    "Unknown retailer";

  const name =
    product.name ||
    product.title ||
    "Pokemon product";

  const url =
    product.url ||
    product.link ||
    "";

  const price =
    product.price ||
    product.currentPrice ||
    "";

  let message =
    "🚨 POKÉMON RESTOCK ALERT 🚨\n\n" +
    `🏪 ${retailer}\n` +
    `📦 ${name}`;

  if (price) {
    message += `\n💰 ${price}`;
  }

  if (url) {
    message += `\n\n🔗 ${url}`;
  }

  return message;
}


/**
 * Format a Pokemon Center queue alert.
 */
function formatCritical(queueEvent) {
  let message =
    "🚨🚨 POKÉMON CENTER QUEUE DETECTED 🚨🚨\n\n" +
    "Pokemon Center may be preparing for a product release/restock.";

  if (queueEvent?.position != null) {
    message += `\n📍 Queue position: ${queueEvent.position}`;
  }

  if (queueEvent?.waitTime) {
    message += `\n⏱️ Estimated wait: ${queueEvent.waitTime}`;
  }

  return message;
}


/**
 * Send product notifications.
 *
 * monitor.js expects an object containing channel results.
 */
async function notify(products) {
  if (!products || products.length === 0) {
    return {
      telegram: {
        sent: false,
      },
    };
  }

  const results = {};

  for (const product of products) {
    const message = formatProduct(product);

    console.log(
      `Sending Telegram alert: ${product.name || product.title}`
    );

    results.telegram = await sendTelegram(message);

    // Avoid sending a large burst of messages.
    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );
  }

  return results;
}


/**
 * Send critical Pokemon Center queue notification.
 */
async function notifyCritical(queueEvent) {
  const message = formatCritical(queueEvent);

  console.log(
    "Sending Telegram Pokemon Center queue alert"
  );

  return {
    telegram: await sendTelegram(message),
  };
}


module.exports = {
  notify,
  notifyCritical,
  sendTelegram,
};
