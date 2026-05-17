const { app } = require("@azure/functions");

const EMAIL_API_URL = "https://emailapi.netcorecloud.net/v5/mail/send";

app.http("sendEmail", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (request, context) => {

    // ── CORS headers — allow requests from the React app ──────────────────
    const corsHeaders = {
      "Access-Control-Allow-Origin":  process.env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      return { status: 204, headers: corsHeaders };
    }

    try {
      const body = await request.json();
      const { to, toName, subject, htmlBody } = body;

      // Validate required fields
      if (!to || !subject || !htmlBody) {
        return {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Missing required fields: to, subject, htmlBody" }),
        };
      }

      // Build payload matching Netcore email API structure
      const payload = {
        from: {
          email: process.env.EMAIL_FROM        || "noreply@finopay.com",
          name:  process.env.EMAIL_FROM_NAME   || "Finopay HR",
        },
        subject,
        content: [
          { type: "html", value: htmlBody },
        ],
        personalizations: [
          {
            to: [{ email: to, name: toName || to.split("@")[0] }],
          },
        ],
      };

      context.log(`[Email] Sending to ${to} — subject: ${subject}`);

      // Call Netcore email API
      const response = await fetch(EMAIL_API_URL, {
        method:  "POST",
        headers: {
          "api_key":      process.env.EMAIL_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      context.log(`[Email] API response ${response.status}: ${responseText}`);

      if (!response.ok) {
        return {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Email API error", details: responseText }),
        };
      }

      return {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ success: true }),
      };

    } catch (err) {
      context.log.error("[Email] Function error:", err.message);
      return {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Internal server error", details: err.message }),
      };
    }
  },
});
