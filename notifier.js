const https = require("https");

function sendTelegram(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.error(
            "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID"
        );
        return;
    }

    const data = JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: false
    });

    const options = {
        hostname: "api.telegram.org",
        path: `/bot${token}/sendMessage`,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data)
        }
    };

    const request = https.request(options, (response) => {
        let body = "";

        response.on("data", (chunk) => {
            body += chunk;
        });

        response.on("end", () => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                console.log("Telegram notification sent.");
            } else {
                console.error(
                    "Telegram API error:",
                    response.statusCode,
                    body
                );
            }
        });
    });

    request.on("error", (error) => {
        console.error(
            "Telegram request failed:",
            error.message
        );
    });

    request.write(data);
    request.end();
}


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
        `🚨 POKÉMON RESTOCK ALERT 🚨\n\n` +
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


async function notify(product) {
    const message = formatProduct(product);

    console.log(message);

    sendTelegram(message);
}


module.exports = {
    notify,
    sendTelegram
};
