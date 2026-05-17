const { app }    = require("@azure/functions");
const nodemailer = require("nodemailer");

// Reuse the transporter across warm invocations
const transporter = nodemailer.createTransport({
  host:   "smtp.office365.com",
  port:   587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: "SSLv3",
  },
});

app.http("sendEmail", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (request, context) => {

    const corsHeaders = {
      "Access-Control-Allow-Origin":  process.env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return { status: 204, headers: corsHeaders };
    }

    try {
      const body = await request.json();
      const { to, toName, subject, htmlBody } = body;

      if (!to || !subject || !htmlBody) {
        return {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Missing required fields: to, subject, htmlBody" }),
        };
      }

      context.log(`[Email] Sending to ${to} — subject: ${subject}`);

      await transporter.sendMail({
        from:    `"${process.env.SMTP_FROM_NAME || "Finopay HR"}" <${process.env.SMTP_USER}>`,
        to:      `"${toName || to.split("@")[0]}" <${to}>`,
        subject,
        html:    htmlBody,
      });

      context.log(`[Email] Sent successfully to ${to}`);

      return {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ success: true }),
      };

    } catch (err) {
      context.error("[Email] Function error:", err.message);
      return {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Internal server error", details: err.message }),
      };
    }
  },
});
