# CRM Project Setup Guide

## 🎯 Project Overview
This is a fully portable CRM application that uses Google Sheets as a backend for authentication and lead management. **No hardcoded secrets or credentials exist in the codebase.**

## ✅ Project Portability
This project is designed to be:
- **Fully editable** by any Lovable user
- **No secret locks** - all credentials are stored in the database settings table
- **Easy to fork** - new users simply configure their own Google Sheet connection
- **No hardcoded personal data** - everything is dynamically configured

## 🚀 Setup Instructions

### Step 1: Create Your Google Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Sheets API**
4. Go to **IAM & Admin** → **Service Accounts**
5. Click **Create Service Account**
6. Give it a name (e.g., "CRM Sheets Sync")
7. Click **Create and Continue** → **Done**
8. Click on the created service account
9. Go to **Keys** tab → **Add Key** → **Create New Key**
10. Select **JSON** format → **Create**
11. Save the downloaded JSON file

### Step 2: Prepare Your Google Sheet
Your Google Sheet must have **2 worksheets**:

#### Worksheet 1: MASTER DATA (Leads)
Columns:
- **A**: TRIP IDS / Notes
- **B**: DATE AND TIME
- **C**: TRIP CONSULTANT
- **D**: LEAD STATUS
- **E**: TRAVELLER NAME
- **G**: TRAVEL DATE
- **H**: TRAVEL STATE
- **K**: REMARKS
- **L**: NIGHTS
- **M**: PAX
- **N**: HOTEL CATEGORY
- **O**: MEAL PLAN
- **P**: PHONE
- **Q**: EMAIL

#### Worksheet 2: BACKEND SHEET (Users)
Columns:
- **C**: Consultant Name
- **D**: Consultant Email (login email)
- **E**: Consultant Phone
- **M**: Role (admin or consultant)
- **N**: Password (plain text for now)

Example BACKEND SHEET:
```
Row 2: | | | John Doe | john@example.com | +1234567890 | | | | | | | | admin | password123 |
Row 3: | | | Jane Smith | jane@example.com | +9876543210 | | | | | | | | consultant | pass456 |
```

### Step 3: Share Sheet with Service Account
1. Open your Google Sheet
2. Click **Share** button
3. Paste the `client_email` from your Service Account JSON (looks like: `your-service-account@your-project.iam.gserviceaccount.com`)
4. Give it **Editor** access
5. Click **Share**

### Step 4: Configure the CRM App
1. **Initial Login** - Use the default admin account (works immediately on all remixed projects):
   - **Email**: `ticketstotrip.com@gmail.com`
   - **Password**: `123456`
   - **Role**: admin
   
   ⚠️ **Important**: This account works before any sync. You can change it later or it will be updated when you sync from your BACKEND SHEET.

2. Go to **Dashboard** → **Settings** tab
3. Fill in:
   - **Google Sheet URL**: Your sheet's full URL
   - **Google Service Account JSON**: Paste the entire JSON content from Step 1
   - **Worksheet Names**: 
     - Worksheet 1: MASTER DATA
     - Worksheet 2: BACKEND SHEET
   - Configure column mappings if different from default
3. Click **Save Settings**
4. Click **Sync Now** button to sync all users from BACKEND SHEET

### Step 5: Login with Your Own Users
After syncing:
1. Logout from default admin account
2. Login with email and password from your BACKEND SHEET
3. All users will have roles (admin/consultant) as defined in the sheet
4. The default admin account will also be updated if it exists in your BACKEND SHEET

## 🔒 Security Notes
- **Default Admin Account**: A default admin (`ticketstotrip.com@gmail.com` / `123456`) is pre-created in every remix for initial setup
  - This account works immediately without sync
  - Change the password or remove it after setting up your own users
  - If this email exists in your BACKEND SHEET, it will be updated during sync
- All Google credentials are stored in the `settings` table in the database
- No secrets are hardcoded in the source code
- Each fork of this project will have its own isolated database
- Service Account JSON is securely stored and only accessible by backend functions
- The Supabase credentials visible in `.env` are project-specific and automatically generated for each new fork

## 🔄 How Sync Works
- **Users**: Synced from BACKEND SHEET (Worksheet 2)
  - Creates/updates user profiles with email, password, role
  - Users can login with these credentials
- **Leads**: Can be synced from MASTER DATA (Worksheet 1)
  - Maps sheet columns to database fields
  - Supports custom column mappings

## 📝 Development Notes
- The app uses Lovable Cloud (Supabase) for backend
- Authentication is custom (not Supabase Auth) - uses profiles table
- All Google API calls are made from backend edge functions
- Frontend never sees the Service Account JSON (secure by design)

## 🤝 Contributing
Since this project has no hardcoded secrets:
1. Fork the project
2. Configure your own Google Sheet and Service Account
3. Make changes and test
4. Submit pull requests if improving core functionality

## 💡 Troubleshooting
- **First time setup?**: Use default admin (`ticketstotrip.com@gmail.com` / `123456`) to login and configure settings
- **Can't login after remix?**: The default admin account is automatically created in all remixed projects
- **Users not synced?**: Click "Sync Now" in Settings after configuring Google Sheet
- **Sync fails?**: Check Service Account JSON format and Sheet sharing permissions
- **No users synced?**: Verify BACKEND SHEET has data in columns C, D, E, M, N
- **Sheet not accessible?**: Ensure Service Account email has Editor access to the sheet

## 🎉 You're All Set!
Your CRM is now fully configured and ready to use. All users from your BACKEND SHEET can login and manage leads from MASTER DATA.
