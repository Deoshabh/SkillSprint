
# SkillSprint Admin Account Guide (Prototype)

This guide explains how administrator accounts are handled within the SkillSprint prototype. Due to its nature as a prototype relying on browser `localStorage` for user data, the concept of "creating" an admin account differs significantly from a production system with a backend database and user management tools.

## 1. Understanding Admin Status in the Prototype

In this SkillSprint prototype:
- User profiles are stored in the browser's `localStorage` under the key `skillSprintUser`.
- A user's role (e.g., `learner`, `educator`, `admin`) is determined by the `role` property within their `UserProfile` object.
- **Admin status is achieved by setting a user's `role` to `'admin'`.**

## 2. The Default Admin User

- When you first run the application and use the default login credentials (typically `alex.johnson@example.com` / `password123`), the `placeholderUserProfile` from `src/lib/placeholder-data.ts` is loaded.
- This `placeholderUserProfile` is **pre-configured with `role: 'admin'`**.
- Therefore, logging in with these default credentials automatically grants you admin access.

```typescript
// Relevant part from src/lib/placeholder-data.ts
export const placeholderUserProfile: UserProfile = {
  // ... other properties
  role: 'admin', // This makes Alex Johnson an admin by default
  profileSetupComplete: true,
  // ... other properties
};
```

## 3. "Creating" or Assigning Admin Role (for Development/Testing)

Since there's no backend admin panel for user creation, making a new or existing user an admin involves manually adjusting their profile data.

### Method A: Using the Simulated User Management Page (Limited)

- The `/admin/user-management` page is designed to simulate user role changes.
- **Limitation:** In its current implementation, this page *only allows the currently logged-in admin user to change their own role*. It does not list other users or allow creating new admins directly through the UI.
- **Use Case:** If you are logged in as an admin (e.g., the default Alex Johnson) and want to temporarily change your role to 'learner' or 'educator' for testing, and then change it back to 'admin', this page can be used.

### Method B: Manually Modifying LocalStorage (Most Direct for Any User)

This is the most direct way to make *any* user (including one you've just signed up with) an admin.

1.  **Log in as the User:** Sign up for a new account or log in as the user you want to make an admin. This ensures their profile is created/loaded into `localStorage`.
2.  **Open Browser Developer Tools:**
    *   In most browsers, right-click on the page and select "Inspect" or "Inspect Element".
    *   Navigate to the "Application" tab (in Chrome/Edge) or "Storage" tab (in Firefox).
3.  **Find LocalStorage:**
    *   In the sidebar of the Developer Tools, find "Local Storage" and expand it.
    *   Select the entry corresponding to your application's domain (e.g., `http://localhost:9002`).
4.  **Edit the `skillSprintUser` Entry:**
    *   You will see a key named `skillSprintUser`. The value will be a JSON string representing the logged-in user's profile.
    *   Double-click the value to edit it.
    *   Carefully find the `"role"` property within the JSON string.
    *   Change its value from whatever it is (e.g., `"learner"`) to `"admin"`.
        ```json
        // Example:
        // Before: {...,"role":"learner",...}
        // After:  {...,"role":"admin",...}
        ```
    *   Ensure the JSON remains valid after your edit.
5.  **Save and Refresh:**
    *   Press Enter or click outside the editing field to save the changes to `localStorage`.
    *   Refresh the SkillSprint application page in your browser.
6.  **Verify:** The user should now have access to admin features and the admin sidebar.

### Method C: Modifying Code (For Persistent Default Changes)

- **For the default placeholder user:** If you want the default login to always be a different role, you can directly edit `src/lib/placeholder-data.ts` and change the `role` for `placeholderUserProfile`.
- **For new signups (Temporary):** If you want all new signups to be admins by default (for extensive testing), you could temporarily modify the `handleSubmit` function in `src/app/signup/page.tsx` to set `role: 'admin'` when creating the `newUserProfile` object before calling `login()`. **Remember to revert this change after testing.**

```javascript
// Example of temporary modification in src/app/signup/page.tsx
// ... inside handleSubmit function
    const newUserProfile = {
      ...placeholderUserProfile, // Or your base user object
      name,
      email,
      // password, // Password is not stored in the profile itself
      role: 'admin', // TEMPORARILY SET TO ADMIN
      profileSetupComplete: false
    };
    login(newUserProfile);
// ...
```

## 4. Important Considerations

- **Prototype Only:** These methods are suitable for a development prototype. Production applications require secure, backend-managed authentication and authorization.
- **Security:** `localStorage` is not secure for sensitive data and can be easily manipulated by the user.
- **No Central User Database:** This prototype does not have a central database of users. Each user's data is isolated to their browser's `localStorage`.

This guide should help you understand and manage admin access within the SkillSprint prototype environment for testing and development purposes.
