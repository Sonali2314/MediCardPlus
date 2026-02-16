# Email Configuration for Doctor Credentials

The system automatically sends login credentials to doctors when they are added by a hospital. 

## Setup Instructions

### Option 1: Gmail (Recommended for Development)

1. Create a `.env` file in the `backend` directory if it doesn't exist
2. Add the following environment variables:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Important for Gmail:**
- You need to use an "App Password" instead of your regular Gmail password
- Enable 2-Step Verification on your Google Account
- Generate an App Password: https://myaccount.google.com/apppasswords
- Use the 16-character app password (no spaces)

### Option 2: Other Email Services

For other email services (Outlook, Yahoo, etc.), update the `.env` file:

```env
EMAIL_SERVICE=outlook  # or 'yahoo', 'hotmail', etc.
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Option 3: Custom SMTP

For custom SMTP servers, you'll need to modify `backend/services/emailService.js` to use SMTP configuration:

```javascript
const transporter = nodemailer.createTransport({
    host: 'smtp.yourdomain.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
```

## Fallback Behavior

If email credentials are not configured:
- The system will log credentials to the console instead
- This is useful for development and testing
- The doctor will still be created successfully
- Credentials will be visible in the backend console logs

## Testing

1. Add a doctor through the hospital dashboard
2. Check the console logs for credentials (if email not configured)
3. Or check the doctor's email inbox (if email is configured)

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique passwords for email accounts
- Consider using a dedicated email account for system emails
- In production, use environment variables or a secrets management service

