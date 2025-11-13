import nodemailer from 'nodemailer'
import { logger } from './logger'

// 邮件配置
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

/**
 * 发送邮件
 */
export const sendEmail = async (options: {
  to: string
  subject: string
  text?: string
  html?: string
}): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"GameHub" <noreply@gamehub.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    }

    const info = await transporter.sendMail(mailOptions)
    logger.info(`邮件已发送: ${info.messageId}`)
    return true
  } catch (error) {
    logger.error('发送邮件失败:', error)
    return false
  }
}

/**
 * 发送验证码邮件
 */
export const sendVerificationEmail = async (
  email: string,
  verificationCode: string
): Promise<boolean> => {
  const subject = 'GameHub - 邮箱验证'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">欢迎加入GameHub！</h2>
      <p>感谢您注册GameHub游戏平台。请使用以下验证码完成邮箱验证：</p>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 3px;">${verificationCode}</span>
      </div>
      <p>验证码有效期为10分钟，请尽快完成验证。</p>
      <p>如果您没有注册GameHub账户，请忽略此邮件。</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #777; font-size: 14px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `

  return sendEmail({
    to: email,
    subject,
    html
  })
}

/**
 * 发送密码重置邮件
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<boolean> => {
  const subject = 'GameHub - 密码重置'
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">密码重置请求</h2>
      <p>您请求重置GameHub账户的密码。请点击下面的链接重置密码：</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; display: inline-block;">重置密码</a>
      </div>
      <p>如果按钮不起作用，您可以复制以下链接到浏览器地址栏：</p>
      <p style="word-break: break-all; color: #0066cc;">${resetUrl}</p>
      <p>此链接将在24小时后失效。</p>
      <p>如果您没有请求重置密码，请忽略此邮件。</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #777; font-size: 14px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `

  return sendEmail({
    to: email,
    subject,
    html
  })
}

/**
 * 发送游戏下载通知邮件
 */
export const sendGameDownloadNotification = async (
  email: string,
  gameName: string,
  downloadUrl: string
): Promise<boolean> => {
  const subject = `GameHub - ${gameName} 已准备好下载`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">游戏已准备好下载！</h2>
      <p>您请求的游戏 <strong>${gameName}</strong> 已准备好下载。</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${downloadUrl}" style="background-color: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; display: inline-block;">立即下载</a>
      </div>
      <p>如果按钮不起作用，您可以复制以下链接到浏览器地址栏：</p>
      <p style="word-break: break-all; color: #0066cc;">${downloadUrl}</p>
      <p>下载链接将在7天后失效。</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #777; font-size: 14px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `

  return sendEmail({
    to: email,
    subject,
    html
  })
}