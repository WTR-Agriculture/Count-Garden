# Count-Garden 🍎

A premium fruit weight recording system built with React, Vite, Tailwind CSS v4, and Google Apps Script.

## 🚀 Setup Instructions

### 1. Backend (Google Sheets & Apps Script)
1.  Create a **new Google Sheet**.
2.  Create 4 tabs and rename them exactly:
    *   `Fruits`
    *   `Categories`
    *   *Note: These two will be auto-filled if you run the `setup` function.*
    *   `Records`
    *   `RecordItems`
3.  Go to **Extensions** > **Apps Script**.
4.  Copy the contents of `backend/Code.gs` from this project and paste it into the script editor.
5.  In the script editor, select the `setup` function from the toolbar and click **Run**. This will create the necessary columns and sample data.
6.  Click **Deploy** > **New Deployment**.
    *   **Type**: Web App
    *   **Execute as**: Me (Your email)
    *   **Who has access**: Anyone
7.  Copy the **Web App URL**.

### 2. Frontend (Local Development)
1.  Rename `.env.example` (or create a `.env`) to `.env`.
2.  Paste your Web App URL:
    ```env
    VITE_GAS_URL=https://script.google.com/macros/s/.../exec
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run locally:
    ```bash
    npm run dev
    ```

### 3. Deployment (Vercel)
1.  Connect your repository to **Vercel**.
2.  In the Project Settings, add an **Environment Variable**:
    *   **Key**: `VITE_GAS_URL`
    *   **Value**: (Your Deployed GAS URL)
3.  Vercel will automatically detect the Vite build and deploy your app.

## 🛠️ Tech Stack
*   **Frontend**: React + Vite
*   **Styling**: Tailwind CSS v4
*   **Icons**: Lucide React
*   **Backend**: Google Apps Script
*   **Database**: Google Sheets
*   **Deployment**: Vercel
