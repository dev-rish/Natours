const mailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Rish Natours <${process.env.EMAIL_FROM}>`;
  }

  // Create transporter
  createTransport() {
    let host, port, user, pass;

    if (process.env.NODE_ENV === 'production') {
      // Mailgun
      host = process.env.PROD_EMAIL_HOST;
      port = process.env.PROD_EMAIL_PORT;
      user = process.env.PROD_EMAIL_USERNAME;
      pass = process.env.PROD_EMAIL_PASSWORD;
    } else {
      host = process.env.DEV_EMAIL_HOST;
      port = process.env.DEV_EMAIL_PORT;
      user = process.env.DEV_EMAIL_USERNAME;
      pass = process.env.DEV_EMAIL_PASSWORD;
    }

    return mailer.createTransport({
      host,
      port,
      auth: { user, pass }
    });
  }

  // Send the actual email
  async send(template, subject) {
    // Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    };

    // Create a transport and send the email
    await this.createTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Password Reset Request | Natours (valid for 10 min)'
    );
  }
}

module.exports = Email;
