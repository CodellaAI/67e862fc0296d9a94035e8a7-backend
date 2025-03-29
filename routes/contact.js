
const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

// Create contact form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: true, 
        message: 'Name, email, and message are required fields' 
      });
    }
    
    // Create new contact submission
    const contact = new Contact({
      name,
      email,
      subject: subject || 'No Subject',
      message,
    });
    
    // Save to database
    await contact.save();
    
    // Send email notification if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await sendEmailNotification(contact);
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // We don't want to fail the request if just the email fails
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Contact form submitted successfully' 
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Failed to submit contact form' 
    });
  }
});

// Helper function to send email notification
async function sendEmailNotification(contact) {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  // Email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Send to yourself
    subject: `New Contact Form Submission: ${contact.subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${contact.name}</p>
      <p><strong>Email:</strong> ${contact.email}</p>
      <p><strong>Subject:</strong> ${contact.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${contact.message.replace(/\n/g, '<br>')}</p>
      <p><strong>Date:</strong> ${contact.createdAt}</p>
    `
  };
  
  // Send email
  return transporter.sendMail(mailOptions);
}

module.exports = router;
