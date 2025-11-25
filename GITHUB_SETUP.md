# GitHub Repository Setup Guide

## Step 1: Initialize Git Repository

Open terminal in your project directory and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Complete backend implementation"
```

## Step 2: Connect to GitHub Repository

```bash
# Add remote repository (replace with your GitHub username if different)
git remote add origin https://github.com/ns-1456/SOEN-287-Final.git

# Verify remote was added
git remote -v
```

## Step 3: Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

If you get authentication errors, you may need to:
- Use a Personal Access Token instead of password
- Or set up SSH keys

## Step 4: Make Repository Public

1. Go to your repository: https://github.com/ns-1456/SOEN-287-Final
2. Click on **Settings** (top right of repository page)
3. Scroll down to **Danger Zone** section
4. Click **Change visibility**
5. Select **Make public**
6. Confirm by typing the repository name

## Step 5: Add Team Members as Collaborators

### Option A: Add Collaborators (Recommended for Team Projects)

1. Go to your repository: https://github.com/ns-1456/SOEN-287-Final
2. Click on **Settings**
3. Click on **Collaborators** in the left sidebar
4. Click **Add people**
5. Enter each team member's GitHub username or email
6. Select permission level: **Write** (allows them to push directly)
7. Click **Add [username] to this repository**

Team members will receive an email invitation to join.

### Option B: Make Repository Public (No Invitations Needed)

If the repository is public, team members can:
- Clone the repository
- Create forks
- Submit pull requests

However, they won't be able to push directly unless you add them as collaborators.

## Step 6: Team Members Setup

Each team member should:

```bash
# Clone the repository
git clone https://github.com/ns-1456/SOEN-287-Final.git

# Navigate to project
cd SOEN-287-Final

# Install dependencies
npm install

# Start the server
npm start
```

## Step 7: Working with Git (For All Team Members)

### Daily Workflow

```bash
# Check current status
git status

# Pull latest changes
git pull origin main

# Make your changes, then:
git add .
git commit -m "Description of your changes"
git push origin main
```

### Creating a Branch for Features

```bash
# Create and switch to new branch
git checkout -b feature-name

# Make changes, then:
git add .
git commit -m "Add feature description"
git push origin feature-name

# Create pull request on GitHub, then merge to main
```

## Troubleshooting

### If you get "repository not found" error:
- Make sure the repository exists on GitHub
- Check that you're using the correct URL
- Verify you have access to the repository

### If you get authentication errors:
- Use Personal Access Token instead of password
- Or set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### If team members can't push:
- Make sure they're added as collaborators (Settings > Collaborators)
- Or they can fork and create pull requests

## Recommended Git Workflow for Team

1. **Before starting work:**
   ```bash
   git pull origin main
   ```

2. **Create a branch for your feature:**
   ```bash
   git checkout -b your-name/feature-description
   ```

3. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "Clear description of changes"
   ```

4. **Push your branch:**
   ```bash
   git push origin your-name/feature-description
   ```

5. **Create Pull Request on GitHub** (optional but recommended)
   - Go to repository on GitHub
   - Click "Compare & pull request"
   - Review changes with team
   - Merge to main

## Important Files Already Included

- `.gitignore` - Excludes node_modules, database files, etc.
- All source code files
- Documentation files

## Security Note

The `.gitignore` file excludes:
- `node_modules/` - Dependencies (install with `npm install`)
- `database/*.db` - Database files (created automatically)
- `.env` - Environment variables (create locally)

Make sure sensitive information is in `.env` and not committed!

