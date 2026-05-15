<?php
// ============================================
// SMTP CONFIG — php/config/smtp.php
// ============================================
// Replace placeholder values with your actual credentials.
// For Gmail: use an App Password (not your regular password).
// 1. Go to your Google Account → Security
// 2. Enable 2-Step Verification
// 3. Go to Security → App Passwords
// 4. Create an App Password for "Mail"
// 5. Paste the 16-character password into SMTP_PASS below

define('SMTP_HOST',      'smtp.gmail.com');   
define('SMTP_PORT',      587);
define('SMTP_USER',      'orders.styledph@gmail.com');
define('SMTP_PASS',      'eqtk hazj ybmm taum');
define('SMTP_FROM',      'orders.styledph@gmail.com');
define('SMTP_FROM_NAME', 'Styled');