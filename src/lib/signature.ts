export const getForYourGoalSignatureTemplate = (displayName?: string, email?: string) => {
  const mail = email || 'imon.khan@foryourgoal.com';
  let name = displayName && displayName.trim() ? displayName.trim() : '';
  if (!name) {
    const localPart = mail.split('@')[0] || 'User';
    name = localPart
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  const role = mail.toLowerCase().startsWith('imon')
    ? 'IT Specialist &amp; Infrastructure Head'
    : mail.toLowerCase().startsWith('support')
    ? 'Customer Support &amp; Help Desk'
    : mail.toLowerCase().startsWith('sales')
    ? 'Sales &amp; Client Relations'
    : mail.toLowerCase().startsWith('billing') || mail.toLowerCase().startsWith('account')
    ? 'Accounts &amp; Billing'
    : 'Professional Services';

  return `<table cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.4; color: #334155; margin-top: 8px;">
  <tr>
    <td style="vertical-align: top; padding-right: 20px; border-right: 2px solid #0284c7; width: 140px;">
      <a href="https://foryourgoal.com" target="_blank" style="text-decoration: none; display: block;">
        <img src="https://mail.foryourgoal.com/images/foryourgoal-logo.png" alt="ForYourGoal Logo" width="130" style="display: block; width: 130px; height: auto; border: 0;" />
      </a>
      <div style="font-size: 11px; color: #64748b; margin-top: 8px; text-align: center; font-weight: 500;">
        Creative Post-Production
      </div>
    </td>
    <td style="vertical-align: top; padding-left: 20px;">
      <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 2px; letter-spacing: -0.2px;">
        ${name}
      </div>
      <div style="font-size: 13px; font-weight: 600; color: #0284c7; margin-bottom: 8px;">
        ${role}
      </div>
      <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
        <strong>ForYourGoal</strong> &bull; High-Volume Image Retouching &amp; Creative Media
      </div>
      <table cellpadding="0" cellspacing="0" border="0" style="font-size: 12px; color: #475569; line-height: 1.6;">
        <tr>
          <td style="padding-right: 8px; color: #0284c7; font-size: 13px;">📞</td>
          <td><a href="tel:+8801613511887" style="color: #0284c7; text-decoration: none; font-weight: 500;">+880 1613-511887</a></td>
        </tr>
        <tr>
          <td style="padding-right: 8px; color: #0284c7; font-size: 13px;">🌐</td>
          <td><a href="https://foryourgoal.com" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 500;">https://foryourgoal.com</a></td>
        </tr>
        <tr>
          <td style="padding-right: 8px; color: #0284c7; font-size: 13px;">✉️</td>
          <td><a href="mailto:${mail}" style="color: #0284c7; text-decoration: none; font-weight: 500;">${mail}</a></td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
};
