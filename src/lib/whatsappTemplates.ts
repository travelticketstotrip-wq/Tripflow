export interface WhatsAppTemplate {
  id: string;
  name: string;
  message: string;
}

export const whatsappTemplates: WhatsAppTemplate[] = [
  {
    id: 'initial_contact',
    name: 'Initial Contact',
    message: `Hello \${customerName}! 👋

Thank you for your interest in planning a trip to \${destination}. 

I'm \${userName} from Tickets To Trip, and I'm here to help you create an unforgettable travel experience.

Could you please share more details about:
- Your preferred travel dates
- Number of travelers
- Any specific preferences or requirements

Looking forward to planning your perfect trip! ✈️`
  },
  {
    id: 'proposal_shared',
    name: 'Proposal Shared',
    message: `Hi \${customerName}! 😊

Great news! I've prepared a customized travel proposal for your \${destination} trip.

📋 Package Details:
- Duration: \${nights} Nights
- Travelers: \${pax} People
- Hotel Category: \${hotelCategory}
- Meal Plan: \${mealPlan}

The complete itinerary with pricing has been shared via email. Please review and let me know if you'd like any modifications.

Best regards,
\${userName}
Tickets To Trip 🌍`
  },
  {
    id: 'follow_up',
    name: 'Follow Up',
    message: `Hello \${customerName}! 

Just following up on the travel proposal I shared for your \${destination} trip.

Have you had a chance to review it? I'm here to answer any questions or make adjustments to better suit your needs.

Looking forward to hearing from you! 😊

\${userName}
Tickets To Trip`
  },
  {
    id: 'booking_confirmation',
    name: 'Booking Confirmation',
    message: `🎉 Congratulations \${customerName}!

Your booking for \${destination} is confirmed! 

Trip Details:
✓ Travel Date: \${travelDate}
✓ Duration: \${nights} Nights
✓ Travelers: \${pax}
✓ Trip ID: \${tripId}

Next steps:
1. You'll receive detailed travel documents via email
2. Payment schedule and instructions included
3. I'll be in touch for any additional requirements

Thank you for choosing Tickets To Trip! 🌟

\${userName}
Your Travel Partner`
  },
  {
    id: 'payment_reminder',
    name: 'Payment Reminder',
    message: `Hello \${customerName},

This is a friendly reminder regarding the payment for your \${destination} trip.

Trip ID: \${tripId}
Travel Date: \${travelDate}

Please complete the payment at your earliest convenience to secure all bookings.

If you have any questions, feel free to reach out!

Best regards,
\${userName}
Tickets To Trip 💳`
  },
  {
    id: 'pre_travel',
    name: 'Pre-Travel Info',
    message: `Hi \${customerName}! 🧳

Your \${destination} trip is just around the corner!

Quick checklist:
✓ Travel documents ready
✓ Hotel vouchers sent
✓ Local contact numbers shared
✓ Travel insurance confirmed

Have an amazing trip! I'll be available if you need any assistance during your journey.

Safe travels! 🌏

\${userName}
Tickets To Trip`
  },
  {
    id: 'post_travel',
    name: 'Post Travel Feedback',
    message: `Welcome back, \${customerName}! 🏡

I hope you had an amazing time in \${destination}!

We'd love to hear about your experience. Your feedback helps us serve you better in future trips.

Also, don't forget - refer a friend and get special discounts on your next adventure! 🎁

Thank you for traveling with Tickets To Trip!

\${userName}
Your Travel Partner 🌟`
  }
];

export const formatTemplate = (
  template: string,
  variables: Record<string, string>
): string => {
  let formatted = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    formatted = formatted.replace(regex, value || '');
  });
  return formatted;
};
