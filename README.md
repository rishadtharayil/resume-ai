# AI-Powered Resume Parser & Applicant Tracking System

This is a full-stack web application designed to streamline the initial stages of the hiring process. It uses the Google Gemini API to intelligently parse resumes uploaded as PDFs, extracting key information like contact details, skills, experience, and education into a structured format.

The application features a public-facing page for candidates to upload their resumes and a secure, protected dashboard for employers to log in, view, search, and manage all submitted applications.

## Core Features

* **AI-Powered Parsing:** Leverages the Gemini API to accurately extract structured data from unstructured PDF resumes.
* **Secure Employer Dashboard:** A protected, login-required section for employers to view and manage candidates.
* **Search & Filtering:** Employers can instantly search for candidates by name or technical skills.
* **Bulk Operations:** Employers can select and delete multiple resume records at once.
* **Original CV Storage:** Stores the original uploaded PDF for employer reference and download.
* **Backend:** Built with Python and Django, using Django REST Framework for the API.
* **Frontend:** A modern, multi-page single-page application (SPA) built with React and styled with Tailwind CSS.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

* **Python** (version 3.8 or higher)
* **Node.js** and **npm** (LTS version recommended)
* **Git** for version control

## How to Run the Project Locally

Follow these steps to set up and run the application on your local machine.

### 1. Clone the Repository

First, clone this repository to your local machine:
```bash
git clone <your-repository-url>
cd <your-project-folder>
```

### 2. Backend Setup (Django)

All these commands should be run from the `resume_backend` directory.

**a. Create and Activate Virtual Environment:**
```bash
# Navigate into the backend directory
cd resume_backend

# Create a virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

**b. Install Python Dependencies:**
```bash
pip install -r requirements.txt
```

**c. Set Up Environment Variables:**
This project requires a Google Gemini API key.

1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Set it as an environment variable in your terminal. **You must do this every time you open a new terminal.**
   ```bash
   # On Windows:
   set GEMINI_API_KEY=YOUR_API_KEY_HERE
   # On macOS/Linux:
   export GEMINI_API_KEY=YOUR_API_KEY_HERE
   ```

**d. Prepare the Database:**
```bash
python manage.py makemigrations
python manage.py migrate
```

**e. Create an Employer Account:**
This creates the login credentials for the employer dashboard.
```bash
python manage.py createsuperuser
```
Follow the prompts to create a username, email, and password.

**f. Start the Django Server:**
```bash
python manage.py runserver
```
Your backend API is now running at `http://localhost:8000`. Keep this terminal open.

### 3. Frontend Setup (React)

Open a **new terminal** for these commands.

**a. Navigate to the Frontend Directory:**
```bash
# From the project root
cd frontend
```

**b. Install Node Dependencies:**
```bash
npm install
```

**c. Start the React Development Server:**
```bash
npm run dev
```
Your React application is now running, usually at `http://localhost:5173`.

## How to Use the Application

1. **Candidate View:** Open your browser and go to `http://localhost:5173`. You can upload a resume, see the parsed data, correct it, and save it to the database.
2. **Employer Login:** Navigate to `http://localhost:5173/login`. Use the superuser credentials you created in the backend setup to log in.
3. **Employer Dashboard:** After logging in, you will be redirected to `http://localhost:5173/dashboard`, where you can view, search, select, delete, and download all submitted resumes.
