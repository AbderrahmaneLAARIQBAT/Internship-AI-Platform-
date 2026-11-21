import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from pathlib import Path

# Create templates directory if it doesn't exist
TEMPLATE_FOLDER = Path(__file__).parent.parent / "templates" / "email"
TEMPLATE_FOLDER.mkdir(parents=True, exist_ok=True)

# Generate a default template
default_template = TEMPLATE_FOLDER / "status_update.html"
if not default_template.exists():
    default_template.write_text("""
    <html>
        <head>
            <style>
                body { font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 20px; }
                .container { max-w-2xl; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; }
                .header { text-align: center; margin-bottom: 30px; }
                .content { color: #334155; line-height: 1.6; }
                .footer { margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; }
                .btn { display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="color: #0f172a;">Intern AI Platform</h2>
                </div>
                <div class="content">
                    <p>Dear {{ name }},</p>
                    <p>There has been an update regarding your internship application.</p>
                    <p><strong>Status:</strong> <span style="color: #2563eb;">{{ status }}</span></p>
                    {% if message %}
                    <p>{{ message }}</p>
                    {% endif %}
                    <p>Log in to your dashboard to view more details.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from the Intern AI Platform.</p>
                </div>
            </div>
        </body>
    </html>
    """)

# In a real enterprise app, we'd read these from the DB `system_settings` or .env
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "test@company.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "test@company.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Intern AI HR"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=TEMPLATE_FOLDER
)

async def send_status_email(email_to: EmailStr, name: str, status: str, custom_message: str = ""):
    """Sends a status update email to the candidate."""
    message = MessageSchema(
        subject=f"Update on your Application Status: {status.title()}",
        recipients=[email_to],
        template_body={"name": name, "status": status.title(), "message": custom_message},
        subtype=MessageType.html
    )
    
    fm = FastMail(conf)
    
    # Check if this is a real deployment or demo. We will just print if we have demo creds.
    if conf.MAIL_USERNAME == "test@company.com":
        print(f"📧 [MOCK EMAIL] Sent to {email_to}: Status is {status}")
        return True
        
    try:
        await fm.send_message(message, template_name="status_update.html")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
