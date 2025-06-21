# api/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.http import Http404
import os
import json
import urllib.request
import fitz 

from django.db.models import Q
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import ResumeSerializer
from .models import Resume

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

class ExtractTextView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        # ... (no changes in this function's logic) ...
        if not GEMINI_API_KEY: return Response({"error": "Gemini API key is not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        if 'file' not in request.FILES: return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
        pdf_file = request.FILES['file']
        try:
            pdf_content = pdf_file.read()
            raw_text = "".join(page.get_text() for page in fitz.open(stream=pdf_content, filetype="pdf"))
            if not raw_text.strip(): return Response({"error": "Could not extract text."}, status=status.HTTP_400_BAD_REQUEST)
            parsed_data = self.parse_resume_with_gemini(raw_text)
            if "error" in parsed_data: return Response({"error": parsed_data["error"]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            skills_text = ', '.join(parsed_data.get('skills', []))
            resume = Resume.objects.create(name=parsed_data.get('name'), email=parsed_data.get('email'), phone=parsed_data.get('phone'), skills=skills_text, education=str(parsed_data.get('education', 'N/A')), experience=str(parsed_data.get('experience', 'N/A')), original_cv=pdf_file)
            response_data = parsed_data
            response_data['id'] = resume.id
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def parse_resume_with_gemini(self, resume_text):
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        
        prompt = f"""
        You are an expert resume parser. Your task is to meticulously analyze the following resume text and extract key information into a structured JSON format.

        **Detailed Instructions:**
        - For the 'skills' field, you MUST only include technical skills and MUST EXCLUDE all soft skills.
        - For the 'experience', 'education', and 'projects' fields, extract each distinct entry as a separate string in the list.
        - If any field is not found, use `null` for single values and an empty list `[]` for lists.

        **Required JSON Output Structure:**
        {{
            "name": "string | null",
            "email": "string | null",
            "phone": "string | null",
            "skills": ["string"],
            "education": ["string"],
            "experience": ["string"],
            "projects": ["string"]
        }}

        **Resume Text to Analyze:**
        ---
        {resume_text}
        ---
        """
        
        payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json"}}
        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(api_url, data=data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode("utf-8"))
                return json.loads(result['candidates'][0]['content']['parts'][0]['text'])
        except Exception as e:
            return {"error": str(e)}

class UpdateResumeView(APIView):
    permission_classes = [AllowAny]
    def get_object(self, pk):
        try: return Resume.objects.get(pk=pk)
        except Resume.DoesNotExist: raise Http404
    def put(self, request, pk, format=None):
        resume = self.get_object(pk)
        data = request.data
        resume.name = data.get('name', resume.name)
        resume.email = data.get('email', resume.email)
        resume.phone = data.get('phone', resume.phone)
        if 'skills' in data and isinstance(data['skills'], list): resume.skills = ', '.join(data['skills'])
        if 'education' in data and isinstance(data['education'], list): resume.education = '\n'.join(data['education'])
        if 'experience' in data and isinstance(data['experience'], list): resume.experience = '\n'.join(data['experience'])
        resume.save()
        return Response({"message": "Resume updated successfully."}, status=status.HTTP_200_OK)

class ResumeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        queryset = Resume.objects.all().order_by('-uploaded_on')
        search_term = self.request.query_params.get('search', None)
        if search_term:
            queryset = queryset.filter(Q(name__icontains=search_term) | Q(skills__icontains=search_term))
        return queryset

# --- NEW VIEW FOR BULK DELETION ---
class BulkDeleteResumesView(APIView):
    """
    A protected view to delete multiple resumes at once.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        ids_to_delete = request.data.get('ids', [])
        
        if not ids_to_delete or not isinstance(ids_to_delete, list):
            return Response({"error": "A list of 'ids' is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            resumes_to_delete = Resume.objects.filter(pk__in=ids_to_delete)
            count = resumes_to_delete.count()
            resumes_to_delete.delete()
            
            return Response({"message": f"{count} resume(s) deleted successfully."}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"An error occurred during deletion: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
