const nodemailer = require("nodemailer");
const axios = require("axios");

exports.sendInvoiceEmail = async (to, subject, text, pdfUrl) => {
  try {
    // Download PDF from Cloudinary using the signed URL
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer'
    });

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Send email with PDF attachment
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: text,
      attachments: [{
        filename: 'invoice.pdf',
        content: response.data,
        contentType: 'application/pdf'
      }]
    });

    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};