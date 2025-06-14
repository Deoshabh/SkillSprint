
# SkillSprint Platform Audit Plan

This document outlines a plan for auditing the features and functionalities of the SkillSprint platform to ensure they are working as expected.

## I. Core User Flow & Authentication

1.  **User Signup (`/signup`)**
    *   **Test Case:** New user attempts to sign up with valid name, email, and password.
    *   **Expected Outcome:** Signup is successful, user is redirected to `/profile-setup`. Toast notification for success. User data (with `profileSetupComplete: false`) is stored.
    *   **Test Case:** Attempt signup with missing/invalid fields.
    *   **Expected Outcome:** Appropriate error messages displayed, signup fails.
2.  **User Login (`/login`)**
    *   **Test Case:** Existing user (profile setup incomplete) logs in with correct credentials.
    *   **Expected Outcome:** Login successful, user redirected to `/profile-setup`. Toast notification.
    *   **Test Case:** Existing user (profile setup complete) logs in.
    *   **Expected Outcome:** Login successful, user redirected to `/dashboard`. Toast notification.
    *   **Test Case:** Attempt login with incorrect credentials.
    *   **Expected Outcome:** Login fails, error message shown (or toast).
3.  **Profile Setup (`/profile-setup`)**
    *   **Test Case:** Newly signed-up user selects role, learning tracks, and language, then submits.
    *   **Expected Outcome:** Preferences are saved to user profile (`profileSetupComplete: true`), user redirected to `/dashboard`. Toast notification.
    *   **Test Case:** Attempt to access `/profile-setup` if profile is already complete.
    *   **Expected Outcome:** User is redirected to `/dashboard`.
4.  **Logout**
    *   **Test Case:** Logged-in user clicks "Log out".
    *   **Expected Outcome:** User is logged out, session/local storage is cleared, user redirected to public home page (`/`).

## II. User-Facing Features

### A. Dashboard (`/dashboard`)
1.  **Welcome Message:** Displays correct user name.
2.  **Continue Learning:** Shows current course and progress if enrolled. Links to the correct module.
3.  **Daily Plan Preview:** Displays a few tasks for today. Links to full planner.
4.  **Points Display:** Shows correct user points.
5.  **Badges Display:** Shows earned badges. Links to achievements page.
6.  **Recommended Courses:** Shows a few course cards. Links to `/courses`.

### B. Course Catalog (`/courses`)
1.  **Course Display:** All published courses are listed with `CourseCard` component.
2.  **Search (Placeholder):** Input field exists. (Actual search functionality is placeholder).
3.  **Filtering (Placeholder):** Category filter dropdown exists. (Actual filtering is placeholder).
4.  **Sorting (Placeholder):** Sort dropdown exists. (Actual sorting is placeholder).

### C. Course Detail Page (`/courses/[courseId]`)
1.  **Course Information:** Title, description, image, instructor, category, icon, duration, rating, enrollment count displayed correctly.
2.  **Module Listing:** All course modules listed using `ModuleItem`. Completion status and current module highlighted.
3.  **User Progress:** Overall progress bar and completed/total modules count accurate.
4.  **Action Buttons:** "Start/Continue Course", "Share", "Wishlist" buttons present.

### D. Module View Page (`/courses/[courseId]/module/[moduleId]`)
1.  **Module Content:** Correct module title, description displayed.
2.  **Media Player:**
    *   Plays default module video (if `contentType` is video and `contentUrl` exists).
    *   Video selection dropdown: Lists module default, `videoLinks`, AI suggestions, and user-added videos for the module. Correctly switches video source.
    *   AI Video Search: Button triggers search; displays loading state; new suggestions appear in dropdown.
    *   User-Added Videos: Form to add new video/playlist to module (up to `USER_MODULE_VIDEO_LIMIT`). Added videos appear in dropdown and can be played. User can remove their added videos.
    *   Playlist Handling: If a playlist URL is selected/loaded, it should embed as a playlist. If items fetched, they should be displayed and navigable.
3.  **Content Display:** Correctly renders markdown if `contentType` is markdown. Placeholder for PDF/Quiz.
4.  **Subtopics & Practice Task:** Displayed if present in module data.
5.  **AI Quiz Generator:** Button generates quiz questions based on module content. Displays loading/error/results.
6.  **Navigation:** "Previous/Next Module" and "Back to Course" links work correctly.
7.  **Course Outline Sidebar:** Lists all modules; current module highlighted; links navigate to correct modules.

### E. Course Designer (User - for their own courses)
1.  **Course Settings Tab:**
    *   Create new course: Saves basic settings (title, category, description, image, visibility).
    *   Edit existing owned course: Loads and allows modification of settings.
    *   Saving updates `localStorage`.
    *   Submit for Review: Works if course is public and status is draft.
2.  **Module Builder Tab:**
    *   Manually add, edit, delete, reorder modules. Changes reflected in UI.
    *   Module Editor Dialog: Allows setting title, description, est. time, content type.
    *   Content URL/Data: Correct input shown based on content type (Video from pool, Markdown textarea).
    *   *AI assistance buttons should be hidden or disabled for non-admin users.*
3.  **Suggested Schedule Tab:**
    *   User can manually enter/edit schedule text. Saved with course.
    *   *AI generation button should be hidden or disabled for non-admin users.*
4.  **Video Pool & AI Tab:**
    *   AI Video Search (for Pool): User can search and add to course video pool.
    *   Manual Add to My Library: User can add videos to their personal library.
    *   My Library: Displays user's videos, can add to course pool or remove from library.
    *   Course Video Pool: Displays videos for the current course, can remove.
    *   *AI Syllabus Generator card should not be present.*

### F. Notes & Draw (`/notes-and-draw`)
1.  **Text Notes CRUD:**
    *   Create new note: Editor appears, save adds to list and profile.
    *   Read: Select note from list, displays in editor.
    *   Update: Edit in editor, save updates existing note in list and profile.
    *   Delete: Remove note from list and profile with confirmation.
    *   Notes persist across sessions for the logged-in user.
2.  **Sketches CRUD:**
    *   Create new sketch: Editor with canvas appears, title input, save adds to list and profile.
    *   Read: Select sketch from list, displays in editor, loads dataURL to canvas.
    *   Update: Edit title or drawing, save updates existing sketch in list and profile.
    *   Delete: Remove sketch from list and profile with confirmation.
    *   Sketches persist across sessions.
3.  **Drawing Canvas:**
    *   Pen Color: Selection works, color changes.
    *   Pen Size: Slider works, stroke width changes.
    *   Undo/Redo: Works for current drawing session.
    *   Clear: Clears canvas.
    *   Show/Hide Canvas: Toggles visibility.

### G. Daily Planner (`/planner`)
1.  **Date Navigation:** Select date via calendar popover; previous/next day buttons work.
2.  **Task Display:** Shows tasks for the selected date, sorted by time.
3.  **Task CRUD:**
    *   Create: Dialog to add new task (title, desc, time, type, optional course). Task added to correct date and profile.
    *   Read: Task details displayed correctly.
    *   Update: Dialog to edit task details. Changes saved to profile.
    *   Delete: Task removed from selected date and profile with confirmation.
4.  **Toggle Task Completion:** Checkbox state updates `isCompleted` status and persists.
5.  **Persistence:** All planner data saved to user profile.

### H. Progress Page (`/progress`)
1.  **Overall Stats:** "Courses Completed", "Modules Completed", "Total Hours Learned" display plausible numbers.
2.  **Enrolled Courses List:** Each enrolled course shows title, category, image, progress bar, completed/total modules, and "Continue/Start Course" button.

### I. Achievements Page (`/gamification`)
1.  **Points Display:** Shows correct user points.
2.  **Earned Badges:** Displays earned badges with icons and names. Tooltips show description.
3.  **Unlockable Badges:** Displays badges not yet earned.

### J. Profile Page (`/profile`)
1.  **User Information:** Displays avatar, name, email, role, learning tracks, preferred language, account status.
2.  **My Created Courses:** Lists courses where user is `authorId`. Links to course designer.
3.  **Edit Profile Button:** (Placeholder - UI exists, functionality not fully implemented beyond role/prefs).

### K. Feedback Form (`/feedback`)
1.  **Submission:** Logged-in user can select feedback type, enter subject, message (and course identifier if relevant).
2.  **Expected Outcome:** Feedback is submitted (added to `placeholderFeedback` array). Toast notification. Form resets.

### L. Floating Chatbot
1.  **Visibility:** Appears for logged-in users. Toggle button opens/closes chat window.
2.  **Interaction:**
    *   Initial greeting from AI.
    *   User can type and send messages.
    *   AI (Doubt Solver flow) responds.
    *   Chat history displayed correctly with user/AI avatars.
    *   Loading indicator while AI responds.

## III. Admin-Facing Features

*Ensure all admin routes/features are inaccessible to non-admin users.*

### A. Admin Sidebar Navigation
1.  **Links Visibility:** Admin-specific links appear only for users with `role: 'admin'`.
2.  **Navigation:** All admin links navigate to the correct pages.

### B. Admin Course Moderation (`/admin/course-designer`)
1.  **Course Lists:** Tabs (Pending, Published, Rejected) correctly filter and display courses.
2.  **Actions:**
    *   Approve/Reject pending courses: Status changes, course moves to appropriate list.
    *   Unpublish published courses: Status changes to 'draft'.
    *   Move rejected courses to 'draft'.
3.  **Links:** "View Course" links to public detail page. "Edit Course" links to main Course Designer.
4.  **Platform Config Display:** Shows current `USER_MODULE_VIDEO_LIMIT`.

### C. AI Course Generator (`/admin/ai-course-generator`)
1.  **Input & Generation:** Admin enters course parameters, clicks "Generate". AI flow is called.
2.  **Output Display:**
    *   Raw syllabus text is shown (if parsing fails or for reference).
    *   Parsed, structured modules (title, description, subtopics, practice task) are displayed in an accordion or list format.
3.  **Expected Outcome:** Admin receives a structured outline to copy/paste or use as a basis for new course creation.

### D. AI Content Scout (`/admin/content-scout`)
1.  **Search:** Admin inputs topic, (optional) creator/language. AI flow is called.
2.  **Suggestions Display:** List of suggested videos appears with iframe preview, title, creator, language, copy URL, and open on YouTube link.

### E. User Management (`/admin/user-management`)
1.  **Display:** Shows current admin user's details (as this is a single-user simulation for role change).
2.  **Role Change:** Admin can change their own role using the dropdown.
3.  **Save:** Role change is persisted to `localStorage` (simulated). Toast on success.

### F. Analytics (`/admin/analytics`)
1.  **UI Display:** Placeholder charts and statistics are visible.
2.  **Expected Outcome:** Page loads without error, indicates data is placeholder.

### G. Messaging (`/admin/messaging`)
1.  **UI Display:** Form for composing subject, body, and selecting segment is visible.
2.  **Send (Simulated):** Clicking "Send" shows a toast confirming simulated broadcast.
3.  **Expected Outcome:** Page loads, form usable, simulation works.

### H. Feedback Management (`/admin/feedback-management`)
1.  **Feedback Display:** Table shows all submitted feedback, sortable by date. Tabs filter by status.
2.  **View Details:** Clicking "View" opens a dialog with full feedback message, user details.
3.  **Update Status/Notes:** Admin can change feedback status and add/edit admin notes in the dialog. Changes are saved (to `placeholderFeedback`).

## IV. Genkit AI Flows (Indirect Testing)

*Verify through the features that utilize them.*
1.  `ai-quiz-generator.ts`: Generates relevant quiz questions on module page.
2.  `auto-generate-course-syllabus.ts`: Provides syllabus text for admin AI Course Generator.
3.  `find-youtube-videos-flow.ts`: Used by AI Content Scout and Module Editor's video search. Returns relevant videos.
4.  `suggest-youtube-videos-for-topic-flow.ts`: Used by Course Designer's video pool search. Returns relevant videos.
5.  `fetch-youtube-playlist-items-flow.ts`: Correctly fetches items when a playlist URL is played in `MediaPlayer`.
6.  `doubt-solver-flow.ts`: Powers the floating chatbot, providing relevant answers.
7.  `suggest-module-subtopics-flow.ts`: Provides relevant subtopic suggestions in Module Editor.
8.  `suggest-module-practice-task-flow.ts`: Provides relevant task suggestions in Module Editor.
9.  `generate-course-schedule-flow.ts`: Generates a markdown schedule in Course Designer's "Suggested Schedule" tab.

## V. General Platform Aspects

1.  **Responsiveness:**
    *   **Test Case:** View key pages (Dashboard, Course Catalog, Course Detail, Module View, Admin pages) on desktop, tablet, and mobile viewport sizes.
    *   **Expected Outcome:** Layout adapts gracefully, content is readable, navigation is usable. Sidebar behavior (collapsible/off-canvas) is correct.
2.  **Theme Toggle (Light/Dark Mode):**
    *   **Test Case:** Switch between light, dark, and system themes.
    *   **Expected Outcome:** UI elements correctly adapt colors. Theme preference persists across sessions (if `ThemeProvider` handles this).
3.  **Toast Notifications:**
    *   **Test Case:** Perform actions that trigger toasts (e.g., save, delete, login, AI errors).
    *   **Expected Outcome:** Toasts appear with correct messages and variants (success, error).
4.  **Error Handling:**
    *   **Test Case:** Intentionally try to cause errors (e.g., submit forms with missing data, simulate AI flow failure if possible).
    *   **Expected Outcome:** Graceful error messages or UI states. No application crashes.
5.  **Security (Admin Route Protection):**
    *   **Test Case:** Attempt to navigate to admin URLs (`/admin/*`) as a non-admin user (e.g., by changing role to 'learner' then trying to access).
    *   **Expected Outcome:** Access denied, or redirected to a safe page (e.g., dashboard or login).
6.  **Accessibility (Basic Checks):**
    *   **Test Case:** Navigate key interactive elements using keyboard (Tab, Enter, Space).
    *   **Expected Outcome:** Focus indicators are visible, elements are operable. (More detailed accessibility audit would require specialized tools/expertise).
    *   Check for `alt` text on images.
    *   Check for `aria-label` or sufficient context for icon buttons.

## VI. Report Structure

The audit report should include:
*   **Overall Summary:** High-level status of the platform.
*   **Detailed Findings:** Section for each feature/area:
    *   **Status:** (Pass / Fail / Partial Pass / Not Tested)
    *   **Observations:** Any specific behaviors noted.
    *   **Bugs/Issues Found:** Detailed description, steps to reproduce, severity.
    *   **Suggestions for Improvement:** (Optional)
*   **Priority List for Fixes.**

This plan should provide a good framework for a thorough audit!
