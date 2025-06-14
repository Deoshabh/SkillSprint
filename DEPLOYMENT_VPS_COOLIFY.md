
# Deploying SkillSprint to a VPS with Coolify

This guide provides steps and considerations for deploying the SkillSprint Next.js application (which includes server-side Genkit flows) to a Virtual Private Server (VPS) using the Coolify self-hostable PaaS.

## 1. Introduction

Coolify is an open-source, self-hostable alternative to services like Heroku and Vercel. It simplifies deploying applications by leveraging Docker and buildpacks. Deploying SkillSprint to a VPS via Coolify gives you more control over your infrastructure.

**Key Considerations for SkillSprint:**
*   **Next.js Application:** Coolify has built-in support for Next.js.
*   **Genkit Flows:** Your Genkit AI flows are part of the Next.js server. The primary requirement is ensuring necessary API keys (e.g., `GEMINI_API_KEY`, `YOUTUBE_API_KEY`) are available as environment variables in the Coolify deployment.
*   **Data Persistence:** This guide focuses on deploying the application. The prototype's reliance on `localStorage` for user data means data will remain browser-specific and not centrally stored or backed up by this deployment method. For production, a separate database solution would be needed.

## 2. Prerequisites

1.  **VPS Setup:**
    *   A VPS running a common Linux distribution (e.g., Ubuntu 20.04/22.04).
    *   Sufficient resources (CPU, RAM, Disk) for Node.js, your app, and Coolify itself. A 2GB RAM VPS is a reasonable starting point.
    *   Root or sudo access to your VPS.
2.  **Docker & Docker Compose:**
    *   Install Docker and Docker Compose on your VPS. Coolify relies on these. Follow official Docker installation guides.
3.  **Coolify Instance:**
    *   Install Coolify on your VPS. Refer to the [official Coolify installation documentation](https://coolify.io/docs/installation).
    *   Ensure Coolify is running and accessible via its web interface.
4.  **Git Repository:**
    *   Your SkillSprint project code hosted in a Git repository (e.g., GitHub, GitLab, Gitea). Coolify will pull code from here.
5.  **Domain Name (Recommended):**
    *   A domain name pointed to your VPS's IP address. Coolify can manage SSL certificates (e.g., via Let's Encrypt) for your domain.

## 3. Coolify Deployment Steps

### 3.1. Connect to Coolify

Access your Coolify dashboard through your browser.

### 3.2. Add Your Server

If you haven't already, add your VPS as a server in Coolify. This usually involves Coolify connecting to your server via SSH.

### 3.3. Create a New Project (Optional)

You can organize your applications into projects within Coolify.

### 3.4. Add New Resource: Application

1.  **Select Source:**
    *   Navigate to your project (or the default one).
    *   Click on "Add Resource" and choose "Application".
    *   Choose your Git provider (e.g., "Public or Private Repository (GitHub, GitLab, etc.)").
    *   If using a private repository, you might need to add Coolify's SSH key to your Git provider or configure a GitHub App integration.

2.  **Configure Application:**
    *   **Select Repository & Branch:** Choose your SkillSprint repository and the branch you want to deploy (e.g., `main` or `master`).
    *   **Build Pack:** Coolify will likely auto-detect Next.js. If not, select **Next.js** or a generic Node.js build pack.
    *   **Install Command:**
        *   Typically `npm install` (if you use `package-lock.json`) or `yarn install` (if you use `yarn.lock`). Your `package.json` should already have this configured implicitly or you can specify.
    *   **Build Command:**
        *   `npm run build` (or `yarn build`).
    *   **Publish Directory:**
        *   For Next.js, this is usually `.next`. Coolify might auto-detect this for the Next.js build pack.

3.  **Configure Port:**
    *   Next.js applications typically run on port `3000` by default.
    *   Coolify will usually handle port mapping automatically. It might ask for the application port. Ensure it's set to `3000` if prompted.

4.  **Set Environment Variables (CRUCIAL for Genkit):**
    *   This is where you'll set your API keys for Genkit.
    *   Go to the "Environment Variables" section for your application in Coolify.
    *   Add your secrets as environment variables:
        *   `GEMINI_API_KEY` = `YOUR_ACTUAL_GEMINI_API_KEY`
        *   `YOUTUBE_API_KEY` = `YOUR_ACTUAL_YOUTUBE_API_KEY`
        *   `NODE_ENV` = `production` (Coolify usually sets this, but good to ensure)
    *   Mark these variables as "Build-time & Runtime" if necessary, though runtime is primary for these keys. Coolify has options to mark variables as "secret".

5.  **Persistent Storage (Not directly for SkillSprint prototype's core app data):**
    *   The SkillSprint prototype uses `localStorage`. If future versions use file-based storage (e.g., for a local Genkit trace store or a SQLite database not recommended for production scaling), you'd configure persistent volume mounts here. For this app, it's not critical unless Genkit local file traces are desired in production (usually, a managed trace store is preferred).

6.  **Domains & SSL:**
    *   Go to the "Domains" section for your application.
    *   Add your domain (e.g., `skillsprint.yourdomain.com`).
    *   Coolify can automatically provision and renew SSL certificates using Let's Encrypt.

### 3.5. Save Configuration & Deploy

1.  **Save Changes:** After configuring, save your application settings.
2.  **Initial Deployment:**
    *   Click the "Deploy" button.
    *   Coolify will pull your code, install dependencies, build the Next.js application, and start it using a Docker container.
    *   You can monitor the deployment logs in the Coolify interface.

## 4. Post-Deployment

1.  **Verify:** Once deployed, access your application via the domain you configured (or the temporary URL Coolify might provide).
2.  **Check Logs:** Use Coolify's log viewer to check for any runtime errors from your Next.js application or Genkit flows.
3.  **Test AI Features:** Ensure that features relying on Genkit (e.g., chatbot, AI content generation) are working, which confirms the API keys are correctly set.

## 5. Important Notes

*   **Data Persistence:** As mentioned, this deployment method does **not** provide a central database for SkillSprint's user data, courses, etc. `localStorage` will continue to be browser-specific. For a production application, you would integrate a managed database (e.g., PostgreSQL, MongoDB, Firestore) and deploy it separately or use Coolify's database services if available/suitable.
*   **Security:**
    *   Keep your VPS operating system and Docker updated.
    *   Regularly update Coolify to the latest version.
    *   Configure a firewall on your VPS (e.g., `ufw`), allowing only necessary ports (HTTP, HTTPS, SSH, Coolify's port).
*   **Backups:**
    *   Coolify can back up its own configuration.
    *   For application data (if you move beyond `localStorage`), you'll need a separate backup strategy for your database.
*   **Scaling:** Coolify might offer basic scaling options (e.g., increasing instance count if using Docker Swarm or Kubernetes mode, though simpler setups use single Docker containers). For high availability, more advanced infrastructure and Coolify configurations would be needed.
*   **Genkit Traces:** By default, Genkit might write traces locally. For production, consider configuring a persistent or cloud-based trace store if detailed Genkit operational monitoring is required. This might involve setting additional environment variables for Genkit's tracing configuration.

This guide provides a starting point for deploying SkillSprint on a VPS with Coolify. Always refer to the official Coolify documentation for the most up-to-date and detailed instructions.
