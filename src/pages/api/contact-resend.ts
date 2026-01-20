import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import getConfig from 'next/config'

// Get server-side runtime config from next.config.js
const { serverRuntimeConfig } = getConfig() || {}

// Helper to get config value from serverRuntimeConfig or process.env
function getEnvVar(key: string): string | undefined {
  return serverRuntimeConfig?.[key] || process.env[key]
}

interface ContactFormData {
  name: string
  email: string
  message: string
}

interface ApiResponse {
  success: boolean
  message: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    })
  }

  const resendApiKey = getEnvVar('RESEND_API_KEY')

  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not configured')
    return res.status(500).json({
      success: false,
      message: 'Email service is not configured',
      error: 'Missing API key'
    })
  }

  try {
    const { name, email, message } = req.body as ContactFormData

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      })
    }

    const resend = new Resend(resendApiKey)

    // Send email to the team
    const { error } = await resend.emails.send({
      from:
        getEnvVar('RESEND_FROM_EMAIL') ||
        'Clio-X Contact Form <info@cliox.org>',
      to: getEnvVar('CONTACT_EMAIL') || 'info@cliox.org',
      replyTo: email,
      subject: `New Contact Form Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #734B3D; border-bottom: 2px solid #734B3D; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Message:</h3>
            <p style="white-space: pre-wrap; color: #555;">${message}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="color: #888; font-size: 12px;">
            This message was sent through the Clio-X contact form.
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: error.message
      })
    }

    return res.status(200).json({
      success: true,
      message:
        'Your message has been sent successfully. We will get back to you soon!'
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
