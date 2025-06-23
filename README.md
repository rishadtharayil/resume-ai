# AI-Powered Resume Analyzer

This is a full-stack web application designed to streamline the recruitment process by leveraging AI to analyze resumes, generate detailed candidate scorecards, and provide actionable insights for hiring managers.

## Key Features

- **AI Scorecard Generation:** Upload a PDF resume (text-based or image-based) and the application uses the Google Gemini API to perform a deep analysis.
- **Detailed Candidate Insights:** The generated scorecard includes an overall rating, work experience analysis, skill evaluation, positive indicators, and potential red flags.
- **Dynamic Frontend:** A clean, responsive user interface built with React and styled with Tailwind CSS.
- **Employer Dashboard:** A secure, ranked list of all candidates, allowing employers to view scorecards and download original CVs.
- **RESTful API:** A robust backend built with Django and Django REST Framework to handle data processing and analysis.

## Project Structure

A high-level overview of the project's directory structure:

-   **frontend/**: Contains the React.js application.
    -   **src/**: Main source code.
        -   **components/**: Reusable React components (Scorecard, Layout, etc.).
        -   **hooks/**: Custom React hooks (e.g., `useAuth`).
        -   **pages/**: Main page components (Dashboard, Upload, Login).
-   **resume_backend/**: Contains the Django project.
    -   **api/**: The Django app for our REST API (models, views, etc.).
    -   **resume_backend/**: Core project settings and configuration.
    -   **manage.py**: Django's command-line utility.

## Technologies Used

**Backend:**
- Python
- Django & Django REST Framework
- Google Gemini API

**Frontend:**
- React.js
- Tailwind CSS
- React Router

## Setup and Installation

To get this project running locally, you'll need to set up both the backend and the frontend.

---

### 1. Backend Setup (Django)

**Prerequisites:**
- Python 3.8+
- `pip`

**Instructions:**

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-repository-name>
    ```

2.  **Navigate to the backend directory:**
    ```bash
    cd resume_backend
    ```

3.  **Create a virtual environment and activate it:**
    ```bash
    python -m venv venv
    # On Windows
    venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    ```

4.  **Install the required Python packages:**
    ```bash
    pip install django djangorestframework django-cors-headers Pillow PyMuPDF python-dotenv
    ```
    *(Note: You can also generate a `requirements.txt` file using `pip freeze > requirements.txt`)*

5.  **Set up environment variables:**
    - In the `resume_backend` directory, create a file named `.env`.
    - Add your Google Gemini API key to this file:
      ```
      GEMINI_API_KEY=your_gemini_api_key_here
      ```

6.  **Apply database migrations:**
    *(Since the latest version uses a `JSONField`, it's best to start fresh if you have an old database.)*
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

7.  **Create a superuser to access the admin and get an auth token:**
    ```bash
    python manage.py createsuperuser
    ```

---

### 2. Frontend Setup (React)

**Prerequisites:**
- Node.js and `npm`

**Instructions:**

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install the required npm packages:**
    ```bash
    npm install
    ```

---

## How to Run the Application

You need to run both the backend and frontend servers simultaneously in separate terminals.

1.  **Start the Django Backend Server:**
    - Navigate to the `resume_backend` directory.
    - Make sure your virtual environment is activated.
    - Run the server:
      ```bash
      python manage.py runserver
      ```
    - The backend API will be available at `http://localhost:8000`.

2.  **Start the React Frontend Server:**
    - Navigate to the `frontend` directory.
    - Run the development server:
      ```bash
      npm run dev
      ```
    - The application will be available at `http://localhost:5173`.

## API Endpoints

| Endpoint                 | Method | Auth Required | Description                                             |
| ------------------------ | ------ | ------------- | ------------------------------------------------------- |
| `/api/api-token-auth/`   | POST   | No            | Login with username/password to get an auth token.      |
| `/api/extract-text/`     | POST   | No            | Upload a PDF resume to generate and save a scorecard.   |
| `/api/resumes/`          | GET    | Yes           | Get a ranked list of all candidates and their scorecards. |
| `/api/resumes/<id>/`     | GET    | Yes           | Get the details for a single candidate.                 |
| `/api/resumes/delete/`   | POST   | Yes           | Bulk delete selected resumes.                           |

## Project Roadmap (Future Enhancements)

- **Job Description Matching:** Implement a feature for employers to post job descriptions. The AI will then analyze and rank candidates based on their suitability for that specific role.
- **Advanced Filtering:** Allow employers to filter the candidate list by more specific criteria found in the scorecard (e.g., "institution tier," "specific hard skills").
- **Interview Question Generation:** Add a feature to the scorecard that uses the AI to generate personalized interview questions based on the candidate's resume.
