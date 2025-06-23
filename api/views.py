# api/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.http import Http404
import os
import json
import urllib.request
import fitz 
import base64

from django.db.models import Q
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import ResumeSerializer
from .models import Resume, Category

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

class ExtractTextView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        if not GEMINI_API_KEY:
            return Response({"error": "Gemini API key is not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        if 'file' not in request.FILES:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
        
        pdf_file = request.FILES['file']
        try:
            pdf_content = pdf_file.read()
            parsed_data = self.parse_resume_with_gemini_vision(pdf_content)

            if "error" in parsed_data:
                return Response({"error": parsed_data["error"]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            skills_text = ', '.join(parsed_data.get('skills', []))
            
            resume = Resume.objects.create(
                name=parsed_data.get('name'),
                email=parsed_data.get('email'),
                phone=parsed_data.get('phone'),
                skills=skills_text,
                education=str(parsed_data.get('education', 'N/A')),
                experience=str(parsed_data.get('experience', 'N/A')),
                projects=str(parsed_data.get('projects', 'N/A')),
                rating=parsed_data.get('rating'),
                original_cv=pdf_file
            )

            category_names = parsed_data.get('categories', [])
            if category_names:
                for cat_name in category_names:
                    category_obj, created = Category.objects.get_or_create(name=cat_name.strip())
                    resume.categories.add(category_obj)
            
            serializer = ResumeSerializer(resume)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"An unexpected error occurred in extract-text: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def parse_resume_with_gemini_vision(self, pdf_content):
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={GEMINI_API_KEY}"
        
        prompt = f"""
        You are a senior technical recruiter and expert resume analyst. Your task is to meticulously analyze the provided resume and return a structured JSON object.

        **Detailed Instructions:**
        1.  **Extract Information:** Pull out the candidate's name, email, phone, skills, education, and projects as specified in the JSON structure.
        2.  **Categorize Roles:** Based on the 'experience' and 'projects' sections, determine a list of suitable job categories. The first category should be the most likely primary role.
        3.  **CRITICAL - Assign a Rating:** You must provide a candidate rating on an integer scale of 1 to 10. You are required to follow these criteria strictly:
            - **1-3 (Poor Fit):** Lacks relevant professional experience, skills, or projects. Major gaps or inconsistencies.
            - **4-6 (Potential Fit):** Some relevant skills or academic projects, but lacks significant professional experience. Entry-level or junior potential.
            - **7-8 (Strong Fit):** Clear evidence of professional experience, relevant skills, and solid projects that match common job requirements. A strong, hirable candidate.
            - **9-10 (Exceptional Fit):** Extensive, highly relevant experience, demonstrates leadership or significant impact in projects, possesses in-demand advanced skills. An top-tier candidate.
            
            **Analyze the entire resume to justify your rating.**

        **Required JSON Output Structure:**
        {{
            "name": "string | null",
            "email": "string | null",
            "phone": "string | null",
            "skills": ["string"],
            "education": ["string"],
            "experience": ["string"],
            "projects": ["string"],
            "categories": ["string"],
            "rating": "number"
        }}
        """
        
        payload_parts = [{"text": prompt}]
        
        try:
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            for page in doc:
                pix = page.get_pixmap(dpi=200)
                img_bytes = pix.tobytes("png")
                base64_image = base64.b64encode(img_bytes).decode('utf-8')
                payload_parts.append({
                    "inline_data": { "mime_type": "image/png", "data": base64_image }
                })

            payload = {
                "contents": [{"parts": payload_parts}],
                "generationConfig": {"response_mime_type": "application/json"}
            }

            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(api_url, data=data, headers={"Content-Type": "application/json"})
            
            with urllib.request.urlopen(req) as response:
                if response.status != 200:
                    error_body = response.read().decode('utf-8')
                    return {"error": f"Gemini API Error {response.status}: {error_body}"}
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
        resume.rating = data.get('rating', resume.rating)
        if 'skills' in data and isinstance(data['skills'], list): resume.skills = ', '.join(data['skills'])
        if 'education' in data and isinstance(data['education'], list): resume.education = '\n'.join(data['education'])
        if 'experience' in data and isinstance(data['experience'], list): resume.experience = '\n'.join(data['experience'])
        if 'projects' in data and isinstance(data['projects'], list): resume.projects = '\n'.join(data['projects'])
        resume.save()
        return Response({"message": "Resume updated successfully."}, status=status.HTTP_200_OK)

class ResumeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # --- MODIFIED ---
        # Changed the default ordering from '-uploaded_on' to '-rating'.
        # This will sort the list from the highest-rated candidate to the lowest.
        # Candidates with no rating will typically appear at the end.
        queryset = Resume.objects.all().order_by('-rating')
        
        search_term = self.request.query_params.get('search', None)
        category = self.request.query_params.get('category', None)
        
        if search_term:
            queryset = queryset.filter(Q(name__icontains=search_term) | Q(skills__icontains=search_term))
            
        if category:
            queryset = queryset.filter(categories__name__iexact=category)
            
        return queryset

class CategoryListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        categories = Category.objects.order_by('name').values_list('name', flat=True)
        return Response(list(categories))

class BulkDeleteResumesView(APIView):
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
