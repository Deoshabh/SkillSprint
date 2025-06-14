
# SkillSprint Platform Documentation

**Version:** Prototype 1.0
**Last Updated:** {{TODAY_DATE_ISO}} (Simulated)

## Table of Contents

1.  [Introduction](#1-introduction)
    *   [1.1 Purpose](#11-purpose)
    *   [1.2 Target Audience](#12-target-audience)
2.  [Core Concepts](#2-core-concepts)
    *   [2.1 User Roles](#21-user-roles)
    *   [2.2 Courses & Modules](#22-courses--modules)
    *   [2.3 Learning Tracks](#23-learning-tracks)
    *   [2.4 Gamification](#24-gamification)
    *   [2.5 AI Assistance](#25-ai-assistance)
3.  [Architecture Overview](#3-architecture-overview)
    *   [3.1 Tech Stack](#31-tech-stack)
    *   [3.2 Data Persistence (Prototype)](#32-data-persistence-prototype)
    *   [3.3 Authentication](#33-authentication)
4.  [User-Facing Features](#4-user-facing-features)
    *   [4.1 Authentication Flow](#41-authentication-flow)
    *   [4.2 Dashboard](#42-dashboard)
    *   [4.3 Course Catalog & Detail](#43-course-catalog--detail)
    *   [4.4 Module View](#44-module-view)
    *   [4.5 Course Designer (User)](#45-course-designer-user)
    *   [4.6 Notes & Draw](#46-notes--draw)
    *   [4.7 Daily Planner](#47-daily-planner)
    *   [4.8 Progress Page](#48-progress-page)
    *   [4.9 Achievements Page](#49-achievements-page)
    *   [4.10 Profile Page](#410-profile-page)
    *   [4.11 Feedback Form](#411-feedback-form)
    *   [4.12 Floating Chatbot](#412-floating-chatbot)
5.  [Admin-Facing Features](#5-admin-facing-features)
    *   [5.1 Admin Dashboard & Navigation](#51-admin-dashboard--navigation)
    *   [5.2 Course Moderation](#52-course-moderation)
    *   [5.3 AI Course Generator](#53-ai-course-generator)
    *   [5.4 AI Content Scout](#54-ai-content-scout)
    *   [5.5 User Management (Simulated)](#55-user-management-simulated)
    *   [5.6 Platform Analytics (Placeholder)](#56-platform-analytics-placeholder)
    *   [5.7 Broadcast Messaging (Placeholder)](#57-broadcast-messaging-placeholder)
    *   [5.8 Feedback Management](#58-feedback-management)
6.  [Generative AI Integration (Genkit)](#6-generative-ai-integration-genkit)
    *   [6.1 Overview of Genkit Flows](#61-overview-of-genkit-flows)
7.  [Key Components & UI Libraries](#7-key-components--ui-libraries)
8.  [Limitations & Future Enhancements](#8-limitations--future-enhancements)
9.  [Setup & Running (Development)](#9-setup--running-development)
10. [Deployment (Firebase App Hosting)](#10-deployment-firebase-app-hosting)

---

## 1. Introduction

### 1.1 Purpose

SkillSprint is an adaptive learning co-pilot platform designed to help users master new skills effectively and efficiently. It leverages AI for course generation, personalized learning plans, and content suggestions. The platform supports various user roles, including learners, educators, and administrators, each with tailored functionalities.

This document describes the prototype version of SkillSprint, highlighting its features, architecture, and core concepts.

### 1.2 Target Audience

This document is intended for:
*   Developers working on or extending the SkillSprint platform.
*   Product managers and designers seeking to understand its capabilities.
*   Testers and QA personnel involved in verifying platform functionality.

---

## 2. Core Concepts

### 2.1 User Roles

*   **Learner:** The primary user focused on consuming course content, tracking progress, and engaging with learning tools.
*   **Educator:** Users who can create and manage their own courses. They have access to the Course Designer tool for building course content.
*   **Admin:** Users with overarching control of the platform. They can moderate courses, manage users (simulated), access AI tools for platform-wide content generation, and view platform analytics.

### 2.2 Courses & Modules

*   **Course:** A structured collection of learning materials focused on a specific topic (e.g., "Full-Stack Development," "English Communication"). Each course has a title, description, category, instructor, modules, and other metadata.
*   **Module:** A smaller unit within a course, typically covering a sub-topic. Modules can contain various content types like videos, text/markdown, PDFs, or quizzes (placeholder). They include estimated completion times, subtopics, and practice tasks.

### 2.3 Learning Tracks

Users can select learning tracks (e.g., "Full-Stack, DSA & DevOps," "Design & AI Tools") during profile setup. This preference can be used for recommending courses or personalizing the learning experience in future iterations.

### 2.4 Gamification

*   **Points:** Users earn points for various activities (e.g., completing modules, courses - though point earning logic is currently conceptual).
*   **Badges:** Users unlock badges for achieving milestones (e.g., "Fast Learner," "Course Completer").

### 2.5 AI Assistance

SkillSprint integrates Generative AI (via Genkit) for various tasks:
*   Generating quiz questions for modules.
*   Generating course syllabi and structured module outlines (admin).
*   Suggesting YouTube videos for topics or specific modules.
*   Generating subtopics and practice tasks for modules (admin).
*   Generating suggested weekly course schedules (admin).
*   Powering a doubt-solving chatbot.

---

## 3. Architecture Overview

### 3.1 Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI Components:** ShadCN UI
*   **Styling:** Tailwind CSS
*   **Generative AI:** Genkit (with Google AI/Gemini models)
*   **State Management:** React Context API (`AuthContext`)
*   **Routing:** Next.js App Router
*   **Utility:** `date-fns` (date formatting), `uuid` (ID generation), `react-hook-form` (forms), `zod` (schema validation for AI flows).

### 3.2 Data Persistence (Prototype)

Due to its prototype nature, SkillSprint uses client-side storage and hardcoded data:
*   **User Profiles & Progress:** Stored in the browser's `localStorage` under the key `skillSprintUser`. This includes user details, preferences, notes, sketches, daily plans, and custom video links.
*   **Course Data, Badges, Feedback:** Primarily sourced from `src/lib/placeholder-data.ts`. This file contains arrays of placeholder courses, modules, badges, and feedback items. Functions within this file simulate data mutations (e.g., updating course status, adding feedback).
*   **Limitations:** This approach means data is not shared between users or browsers and is not secure for production use. A backend database is a primary requirement for a production system.

### 3.3 Authentication

Authentication is simulated using `AuthContext`:
*   User credentials are not stored securely. Login and signup processes use placeholder logic.
*   The `AuthContext` manages the user state (logged in/out) and provides user data to components.
*   Admin access is determined by the `role: 'admin'` property in the user's profile.

---

## 4. User-Facing Features

### 4.1 Authentication Flow

*   **Signup (`/signup`):** New users can create an account by providing their name, email, and password. Upon successful signup, they are redirected to profile setup.
*   **Login (`/login`):** Existing users can log in. The prototype uses predefined credentials (`alex.johnson@example.com` / `password123`) for the default admin user.
*   **Profile Setup (`/profile-setup`):** After signup or first login for an incomplete profile, users select their role, learning tracks, and preferred language. This marks their profile as `profileSetupComplete: true`.
*   **Logout:** Clears user data from `localStorage` and redirects to the public home page.

### 4.2 Dashboard (`/dashboard`)

The central hub for logged-in users, displaying:
*   Welcome message.
*   "Continue Learning" section for their current course.
*   Preview of today's tasks from the Daily Planner.
*   Total points earned.
*   Recently earned badges.
*   Recommended courses.

### 4.3 Course Catalog & Detail (`/courses`, `/courses/[courseId]`)

*   **Catalog:** Lists available courses using `CourseCard` components. Includes placeholder UI for search, filtering, and sorting.
*   **Detail Page:** Shows comprehensive information about a selected course: title, description, image, instructor, category, modules, user progress bar, and action buttons (Start/Continue, Share, Wishlist).

### 4.4 Module View (`/courses/[courseId]/module/[moduleId]`)

The page where users interact with individual module content:
*   **MediaPlayer:** Displays module content (video, markdown, PDF iframe placeholder, quiz placeholder).
    *   For video modules:
        *   Allows selection from module's default video, pre-linked videos, AI-suggested videos, and user-added videos for that specific module.
        *   AI video search functionality to find more relevant videos.
        *   Form to add custom videos/playlists to the current module (up to `USER_MODULE_VIDEO_LIMIT`).
        *   Handles YouTube playlist embedding and item fetching.
*   **Subtopics & Practice Task:** Displays these if defined for the module.
*   **AI Quiz Generator:** Button to generate practice quiz questions based on module content.
*   **Navigation:** Links to previous/next modules and back to the course detail page.
*   **Course Outline Sidebar:** Lists all course modules for quick navigation.

### 4.5 Course Designer (User) (`/course-designer`)

Accessible to users (especially those with `role: 'educator'` or `admin`) to create or edit their own courses (or any course if admin).
*   **Course Settings Tab:** Manage basic course details (title, category, description, image, visibility, status). Submit for review (if public draft).
*   **Module Builder Tab:**
    *   Manually add, edit, delete, and reorder modules.
    *   Module Editor Dialog: Set module title, description, content type, estimated time, content URL (from course video pool for videos), or markdown content.
    *   *Module-level AI assistance (subtopics, task, video find) is disabled for non-admin users.*
*   **Suggested Schedule Tab:**
    *   Manually enter and save a markdown-based suggested weekly schedule for the course.
    *   *AI schedule generation button is disabled for non-admin users.*
*   **Video Pool & AI Tab:**
    *   AI Video Search (for Pool): Users can search YouTube and add relevant videos to the course's video pool.
    *   Manual Add to My Library: Users can add videos to their personal library (stored in their profile).
    *   My Library: Displays user's personal video library; videos can be added to the current course's pool or removed from the library.
    *   Course VideoPool: Displays videos specifically added to the current course being designed; videos can be removed from the pool.
    *   *The AI Syllabus Generator card is not present here for regular users; it's an admin tool on a dedicated page.*

### 4.6 Notes & Draw (`/notes-and-draw`)

A personal workspace for users:
*   **Text Notes:** Full CRUD (Create, Read, Update, Delete) for text-based notes. Notes are saved to the user's profile.
*   **Sketches:** Full CRUD for sketches. Users can draw on a canvas, save sketches (as data URLs), view, edit titles, or update drawings. Sketches are saved to the user's profile.
*   **Drawing Canvas:** Features pen color selection, pen size adjustment, undo/redo (session-based), and clear canvas functionality.

### 4.7 Daily Planner (`/planner`)

Allows users to manage their daily tasks:
*   **Date Navigation:** Select date via calendar popover or previous/next day buttons.
*   **Task Display:** Shows tasks for the selected date, sorted by time.
*   **Task CRUD:** Dialogs to create, edit, and delete tasks (title, description, time, type, optional course link).
*   **Task Completion:** Toggle task `isCompleted` status.
*   All planner data is saved to the user's profile.

### 4.8 Progress Page (`/progress`)

Displays an overview of the user's learning journey:
*   Overall statistics: Courses completed, modules completed, total hours learned (estimated).
*   List of enrolled courses with individual progress bars, completed/total modules, and a "Continue/Start Course" button.

### 4.9 Achievements Page (`/gamification`)

Focuses on gamification elements:
*   Displays total user points.
*   Shows earned badges with icons, names, and descriptions (via tooltips).
*   Lists unlockable badges.

### 4.10 Profile Page (`/profile`)

Shows user account information:
*   Avatar, name, email, role, selected learning tracks, preferred language, and account status (profile setup complete/incomplete).
*   Lists "My Created Courses" (courses where `authorId` matches the user's ID), with links to edit them in the Course Designer.
*   "Edit Profile" button is a placeholder, as full profile editing beyond initial setup (role, preferences) is not implemented.

### 4.11 Feedback Form (`/feedback`)

A dedicated page for logged-in users to submit feedback to platform administrators.
*   Allows selection of feedback type (General, Course, Bug, Feature Request).
*   Fields for subject, message, and optional course identifier.
*   Submitted feedback is added to a global placeholder list managed by admins.

### 4.12 Floating Chatbot

A persistent chatbot accessible to logged-in users:
*   Togglable chat window.
*   Initiates with a greeting.
*   Powered by the `doubtSolverFlow` to answer user queries related to platform content and features.
*   Displays chat history and loading indicators.

---

## 5. Admin-Facing Features

Administrators have access to specialized tools for platform management, content creation, and moderation. Access is controlled by `user.role === 'admin'`.

### 5.1 Admin Dashboard & Navigation

*   The main sidebar dynamically shows an "Admin Tools" section for admin users.
*   All admin routes (e.g., `/admin/*`) are intended for admin access only, though current protection is client-side.
*   All admin pages include a consistent "Admin Capabilities Overview" card summarizing available admin features and their status.

### 5.2 Course Moderation (`/admin/course-designer`)

This page provides an admin-specific view for managing courses submitted for review:
*   **Tabs:** Filter courses by status (Pending Review, Published, Rejected).
*   **Actions:**
    *   Approve or reject pending courses.
    *   Unpublish live courses (moves them to 'draft' status).
    *   Move rejected courses back to 'draft' status (e.g., for author revision).
*   **Links:** View course details publicly or edit any course using the main Course Designer.
*   Displays platform configurations like `USER_MODULE_VIDEO_LIMIT`.

### 5.3 AI Course Generator (`/admin/ai-course-generator`)

A dedicated admin tool for advanced AI-driven course creation:
*   **Inputs:** Course topic, target audience, learning objectives, desired number of modules.
*   **Process:** Calls the `autoGenerateCourseSyllabus` flow.
*   **Output:**
    *   Displays the raw AI-generated syllabus text.
    *   Parses this text into a structured list of modules (with titles, descriptions, subtopics, practice tasks).
*   Admins can use this structured output as a strong starting point for creating new courses in the main Course Designer.

### 5.4 AI Content Scout (`/admin/content-scout`)

Helps admins discover relevant YouTube video content:
*   **Inputs:** Search topic/keywords, optional preferred creator, optional preferred language.
*   **Process:** Calls the `suggestYoutubeVideosForTopic` flow.
*   **Output:** Displays a list of suggested videos with titles, creators, language, iframe previews, and links to copy the URL or open on YouTube.

### 5.5 User Management (Simulated) (`/admin/user-management`)

A placeholder page for user management. In the current prototype:
*   It displays the currently logged-in admin user's details.
*   Allows the admin to change *their own* role (e.g., to 'learner' for testing purposes).
*   This change is saved to `localStorage`. Full multi-user management would require a backend.

### 5.6 Platform Analytics (Placeholder) (`/admin/analytics`)

A UI placeholder for platform analytics:
*   Displays sample charts (user growth, popular categories) and statistics.
*   Indicates that the data is not live and full integration is pending.

### 5.7 Broadcast Messaging (Placeholder) (`/admin/messaging`)

A UI placeholder for sending messages to user segments:
*   Provides a form to compose a message (subject, body) and select a target segment (e.g., "All Users," "Active Learners").
*   Sending a message is simulated with a toast notification. Backend integration is required for actual delivery.

### 5.8 Feedback Management (`/admin/feedback-management`)

Allows admins to review and manage user-submitted feedback:
*   **Table View:** Displays all feedback items, sortable by date.
*   **Tabs:** Filter feedback by status (All, New, In Progress, Resolved, Archived).
*   **Details Dialog:** Admins can view the full feedback message, user details, and update the feedback status or add internal admin notes. Changes are saved to the `placeholderFeedback` array.

---

## 6. Generative AI Integration (Genkit)

SkillSprint uses Genkit for all Generative AI functionalities. A global `ai` object is configured in `src/ai/genkit.ts`.

### 6.1 Overview of Genkit Flows

All Genkit flows are located in `src/ai/flows/`:
*   **`ai-quiz-generator.ts` (`generateQuiz`):** Generates quiz questions for a given module's content.
*   **`auto-generate-course-syllabus.ts` (`autoGenerateCourseSyllabus`):** Generates a detailed course syllabus in markdown based on topic, audience, objectives, and module count. Used by the Admin AI Course Generator.
*   **`find-youtube-videos-flow.ts` (`findYoutubeVideosForModule`):** Finds relevant YouTube videos for a specific course module, considering existing content and preferred language. Used in the Module Editor (admin).
*   **`suggest-youtube-videos-for-topic-flow.ts` (`suggestYoutubeVideosForTopic`):** Suggests YouTube videos based on a general topic query. Used by AI Content Scout (admin) and Course Designer's Video Pool search (user/admin).
*   **`fetch-youtube-playlist-items-flow.ts` (`fetchYoutubePlaylistItems`):** Fetches individual video details from a given YouTube playlist ID. Used by the `MediaPlayer` component.
*   **`doubt-solver-flow.ts` (`doubtSolver`):** Powers the floating chatbot, providing contextual answers to user queries.
*   **`suggest-module-subtopics-flow.ts` (`suggestModuleSubtopics`):** Suggests relevant subtopics for a given module title/description. Used in the Module Editor (admin).
*   **`suggest-module-practice-task-flow.ts` (`suggestModulePracticeTask`):** Suggests a practice task or mini-project for a module. Used in the Module Editor (admin).
*   **`generate-course-schedule-flow.ts` (`generateCourseSchedule`):** Generates a suggested weekly course schedule in markdown. Used in the Course Designer's "Suggested Schedule" tab (admin).
*   **`auto-generate-quiz-mock-tests.ts` (`autoGenerateAssessments`):** (Less directly used in UI currently) A general flow to generate various assessment types.

---

## 7. Key Components & UI Libraries

*   **ShadCN UI:** Provides the foundational UI components (Button, Card, Input, Dialog, etc.), which are then customized.
*   **`src/components/layout/main-layout.tsx`:** Defines the main application shell with sidebar and header.
*   **`src/components/course-card.tsx`:** Displays individual course previews.
*   **`src/components/module-item.tsx`:** Displays modules within a course detail page.
*   **`src/components/media-player.tsx`:** Handles rendering of various module content types (video, markdown, PDF, quiz placeholder).
*   **`src/components/daily-plan-item.tsx`:** Renders individual tasks in the planner.
*   **`src/components/drawing-canvas.tsx`:** Provides the interactive sketching canvas.
*   **`src/components/chatbot/floating-chatbot.tsx`:** Implements the AI assistant interface.
*   **Custom UI Components:** Various specialized components in `src/components/ui/` (Sidebar, Chart, etc.).

---

## 8. Limitations & Future Enhancements

As a prototype, SkillSprint has several limitations and areas for future development:

*   **Backend & Database:** The most significant limitation. A robust backend is needed for:
    *   Secure user authentication and management.
    *   Persistent storage of all data (users, courses, progress, notes, feedback).
    *   Reliable real-time updates.
*   **Security:** Admin route protection is client-side and not secure. Proper backend authorization is required.
*   **Full Feature Implementation:**
    *   Course Catalog: Search, filtering, sorting, and pagination are placeholders.
    *   Profile Page: Full profile editing (name, password) is not implemented.
    *   Admin Analytics: Data is placeholder; needs backend integration.
    *   Admin Messaging: Delivery is simulated; needs backend integration.
    *   Quiz Engine: Actual quiz-taking, submission, and grading are not implemented.
    *   PDF Viewer: Currently uses a basic `iframe`; a more robust viewer could be integrated.
*   **Error Handling:** While basic error toasts exist, comprehensive `error.js` boundaries for Next.js segments could be more extensively used.
*   **Accessibility & Responsiveness:** While built with accessible components (ShadCN) and responsive design (Tailwind), thorough manual testing across devices and with accessibility tools is crucial for production.
*   **Content Variety:** Support for more module content types (e.g., interactive simulations, SCORM).
*   **Collaboration Features:** (e.g., discussion forums, peer reviews).
*   **Advanced Personalization:** Deeper AI integration for adaptive learning paths based on user performance.

---

## 9. Setup & Running (Development)

1.  **Prerequisites:** Node.js, npm/yarn.
2.  **Environment Variables:**
    *   Create a `.env` file in the project root.
    *   Add `GEMINI_API_KEY=YOUR_API_KEY` for Genkit AI features.
    *   Add `YOUTUBE_API_KEY=YOUR_API_KEY` for `fetchYoutubePlaylistItemsFlow`.
3.  **Install Dependencies:** `npm install` or `yarn install`.
4.  **Run Development Server:**
    *   Next.js app: `npm run dev` (typically on `http://localhost:9002`)
    *   Genkit development UI (optional, for testing flows): `npm run genkit:dev` (typically on `http://localhost:4000`)

---

## 10. Deployment (Firebase App Hosting)

This project is structured for deployment to Firebase App Hosting, which supports Next.js applications with server-side functionalities like Genkit flows.

### 10.1 Prerequisites

*   **Firebase CLI:** Ensure you have the Firebase CLI installed and updated: `npm install -g firebase-tools`.
*   **Firebase Project:** Create or select an existing Firebase project in the [Firebase Console](https://console.firebase.google.com/).
*   **Login to Firebase:** Authenticate with Firebase: `firebase login`.
*   **Initialize Firebase in your project (if not already done):** Run `firebase init` in your project root and select "App Hosting". Follow the prompts to connect to your Firebase project and set up a backend.

### 10.2 Configuration

1.  **Firebase App Hosting Backend (`apphosting.yaml`):**
    *   This file is already present in your project root (`apphosting.yaml`). It contains basic configuration for the App Hosting backend, like `maxInstances`. You can adjust these settings as needed based on Firebase documentation.

2.  **Environment Variables for Genkit:**
    *   Your Genkit flows (e.g., for Gemini and YouTube API) require API keys. These should **NOT** be hardcoded or committed to your repository.
    *   Set these as secrets in your Firebase App Hosting backend:
        *   In the Firebase Console, navigate to your project -> App Hosting.
        *   Select your backend.
        *   Go to the "Settings" or "Environment variables" section.
        *   Add your secrets, for example:
            *   `GEMINI_API_KEY` = `YOUR_ACTUAL_GEMINI_API_KEY`
            *   `YOUTUBE_API_KEY` = `YOUR_ACTUAL_YOUTUBE_API_KEY`
    *   Your `src/ai/genkit.ts` and `src/ai/flows/fetch-youtube-playlist-items-flow.ts` files already use `process.env.GEMINI_API_KEY` and `process.env.YOUTUBE_API_KEY` respectively, which App Hosting will populate from the secrets you set.

### 10.3 Build

Before deploying, ensure your application builds successfully:
```bash
npm run build
```
This command creates an optimized production build of your Next.js application.

### 10.4 Deployment Commands

To deploy your application to Firebase App Hosting, use the Firebase CLI:

1.  **Deploy specific backend (if you have multiple):**
    If you know your App Hosting backend ID (e.g., `my-skillprint-app`), you can deploy it directly:
    ```bash
    firebase apphosting:backends:deploy YOUR_BACKEND_ID --project YOUR_FIREBASE_PROJECT_ID
    ```
    (Replace `YOUR_BACKEND_ID` and `YOUR_FIREBASE_PROJECT_ID` accordingly).

2.  **General Deploy Command (Recommended):**
    The simpler command will deploy all Firebase services configured in your `firebase.json` (which App Hosting setup should configure for you):
    ```bash
    firebase deploy --only apphosting
    ```
    If you only have one App Hosting backend, this usually works without specifying the backend ID.

### 10.5 Post-Deployment

1.  **Check Deployed URL:** After a successful deployment, the Firebase CLI will output the URL of your live application. You can also find this URL in the Firebase Console under App Hosting.
2.  **Monitor Logs:** Use the Firebase Console to monitor logs for your App Hosting backend to troubleshoot any runtime issues.
3.  **Manage Backend:** You can manage your deployed backend (scaling, environment variables, domains) through the Firebase Console.

**Important Notes for Production:**
*   **Data Persistence:** The current prototype uses `localStorage`. For a production deployment, you would need to migrate to a persistent database solution (e.g., Firestore, Cloud SQL) and update your data handling logic accordingly. This is a significant architectural change.
*   **Security:** Implement robust server-side authentication and authorization for all sensitive operations, especially admin features. Client-side checks are not sufficient for production.
*   **Genkit in Production:** Ensure your Genkit flows are optimized and handle errors gracefully. Consider Genkit's production best practices.

This documentation provides a snapshot of the SkillSprint platform. It's a feature-rich prototype with a strong foundation for further development into a production-ready learning management system.

