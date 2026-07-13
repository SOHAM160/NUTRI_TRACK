import ApiError from './ApiError.js';

export const sendGoalReachedEmail = async (email, name, completedGoals, allGoalsProgress) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM;

  if (!brevoApiKey || !senderEmail) {
    console.error('Brevo API key or sender email not configured');
    return;
  }

  const goalNames = completedGoals.map(g => g.name).join(', ');
  const statsToDisplay = allGoalsProgress || completedGoals;

  const payload = {
    sender: { email: senderEmail, name: 'NutriTrack' },
    to: [{ email, name }],
    subject: `Congratulations! You've reached your goals today! 🎉`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #f97316; margin: 0;">NutriTrack</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333333; margin-top: 0;">Amazing job, ${name}!</h2>
          <p style="color: #666666; font-size: 16px; line-height: 1.5;">
            You have successfully reached your <strong>${goalNames}</strong> goals for today! Consistency is key to achieving your fitness objectives!
          </p>
          <div style="background-color: #fff3ed; border: 1px solid #ffd8c4; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            ${statsToDisplay.map(g => `
              <div style="margin-bottom: 10px; padding: 10px; background-color: rgba(255, 255, 255, 0.8); border-radius: 6px;">
                <span style="color: #666; font-size: 14px; text-transform: uppercase; font-weight: bold; margin-right: 15px;">${g.name}</span>
                <span style="color: ${g.current >= g.target ? '#d03000' : '#475569'}; font-size: 18px; font-weight: bold;">
                  ${g.current} / ${g.target} ${g.unit} ${g.current >= g.target ? '✅' : ''}
                </span>
              </div>
            `).join('')}
          </div>
          <p style="color: #666666; font-size: 16px; line-height: 1.5;">
            Keep up the fantastic work and stay on track with NutriTrack.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #999999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} NutriTrack. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API Error:', errorData);
    }
  } catch (error) {
    console.error('Failed to send goal notification email:', error);
  }
};
