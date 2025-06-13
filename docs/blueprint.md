# **App Name**: SkillSprint

## Core Features:

- Course Catalog: Browse pre-built courses (Full-Stack, DSA, DevOps, English, Design & AI Tools, Aptitude).
- Daily Planner: Follow a personalized daily plan, derived from your courses.
- Progress Tracking: Track your progress across courses and modules.
- AI Quiz Generator: Generate practice quizzes and mock tests using AI tools based on course modules. The AI will act as a tool, determining when the current lesson can be effectively measured.
- Integrated Player: Embed YouTube videos, display markdown content, and view PDFs directly within the learning platform.
- Gamification: Earn points and badges as you complete modules and courses.
- Rich-Text Editor: WYSIWYG or Markdown for message body. Embed links, images, buttons (e.g. “Start Quiz Now”).
- Channel Selection: In-App Push Notifications (Firebase Cloud Messaging), Email (SendGrid templates), SMS (Twilio or similar)
- Audience Targeting: Target the entire user base, or filter by Course enrollment, Progress, Engagement, or Custom segments.
- Immediate vs. Scheduled: Option to Send Now or pick a date/time for the message.
- Recurring Broadcasts: Set messages to send daily, weekly, or custom intervals.
- Time-Zone Awareness: Send messages at local 9:00 AM in each user’s time zone.
- Reusable Templates: Save common announcements (e.g. “New Course Live!”) for reuse.
- Merge Tags: Personalize messages with {{firstName}}, {{courseName}}, {{nextModuleDate}}.
- A/B Variants: Test two subject lines or message bodies among a subset of users.
- Delivery Metrics: Track Emails: opens, clicks, bounces. Push: delivered, opened, dismissed
- Engagement Tracking: Track clicks on message links to follow progress into course or quiz, and conversion rates.
- History & Logs: View past broadcasts, status, and detailed reports.
- Broadcast Center: "Broadcast Center" Section under Admin Dashboard
- Wizard Flow: Wizard Flow: Wizard Flow: Select Audience, Choose Channels, Compose Message (with preview), Schedule & Review, Confirm & Send
- Dashboard Widgets: Dashboard Widgets: Dashboard Widgets: Dashboard Widgets: Upcoming Scheduled Broadcasts, Recent Broadcast Performance
- Custom Course Designer: Drag‑and‑drop weekly module builder, CSV, YAML, JSON import/export, AI Auto‑Designer (Llama-4 or Google AI and Open-Source AI or LLM Models), Auto-generate full syllabi, module breakdowns, Quiz, mock test, and practice task generation, Version control for custom courses, Users can clone, share, or publish custom tracks, Admin Custom Course Controls, Set limits on number of custom courses/user, Enforce module count/size limits, Manual approval workflow for public custom courses

## Style Guidelines:

- Primary color: HSL(210, 65%, 50%) - A vibrant, yet professional blue to convey trust and knowledge. Hex code: #3498db.
- Background color: HSL(210, 20%, 95%) - A light, desaturated blue to provide a clean and modern backdrop. Hex code: #F0F8FF.
- Accent color: HSL(180, 55%, 45%) - A teal that adds a touch of freshness and highlights key interactive elements. Hex code: #45B8AC.
- Body text and headline font: 'Inter', a sans-serif font for a clean and modern reading experience.
- Use a consistent set of minimalistic icons to represent different courses, modules, and features.
- Implement a responsive layout that adapts seamlessly to different screen sizes.
- Employ subtle transitions and animations to enhance user experience and provide feedback on interactions.