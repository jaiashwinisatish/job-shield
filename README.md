# JobShield 

## Project info

**JobShield** is a comprehensive platform designed to protect job seekers from fraudulent job postings and recruitment scams.

## How can I edit this code?

There are several ways of editing this application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (PostgreSQL database)
- Supabase Edge Functions

## Features

- **Job Scam Detection**: Advanced algorithms analyze job postings for red flags
- **Company Verification**: Verifies company authenticity through multiple data sources
- **Domain Analysis**: Checks job posting domains for legitimacy
- **Email Verification**: Validates recruiter email addresses
- **Risk Scoring**: Provides comprehensive risk assessment (0-100 scale)
- **Community Intelligence**: Aggregates scam reports from the community

## How can I deploy this project?

This project uses Supabase for backend services. Please refer to the `BACKEND_README.md` for detailed deployment instructions.
