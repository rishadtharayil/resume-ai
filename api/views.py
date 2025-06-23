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

# --- MODIFIED: Added 'models' import ---
from django.db import models
from django.db.models import Q
from django.db.models.functions import Cast
from django.db.models import FloatField
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import ResumeSerializer
from .models import Resume

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
            # --- MODIFIED: Call the new scorecard generator ---
            scorecard = self.generate_scorecard_with_gemini(pdf_content)

            if "error" in scorecard:
                return Response({"error": scorecard["error"]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # --- MODIFIED: Save scorecard to the database ---
            resume = Resume.objects.create(
                name=scorecard.get('basic_information', {}).get('name'),
                email=scorecard.get('basic_information', {}).get('email'),
                scorecard_data=scorecard, # Save the entire JSON object
                original_cv=pdf_file
            )
            
            serializer = ResumeSerializer(resume)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def generate_scorecard_with_gemini(self, pdf_content):
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={GEMINI_API_KEY}"
        
        # --- NEW "SUPER-PROMPT" ---
        prompt = f"""
        You are a world-class Senior Technical Recruiter and Data Analyst. Your task is to analyze the provided resume (as page images) and generate a comprehensive "Candidate Scorecard" in a single, valid JSON object. Do not include any text outside of the JSON object.

        Analyze all sections of the resume to fill out the following JSON structure. For any fields where information is not available, use `null` for single values or an empty list `[]` for arrays.

        **JSON Structure to Populate:**
        {{
          "overall_score": "number (1.0-10.0, float)",
          "basic_information": {{
            "name": "string",
            "email": "string",
            "phone": "string",
            "linkedin": "string (full URL, or null)",
            "location": "string (e.g., 'City, Country')"
          }},
          "work_experience_analysis": {{
            "seniority_progression": ["string (e.g., 'Intern -> Software Engineer -> Senior Engineer')"],
            "tenure_summary": "string (e.g., 'Average tenure of 2.5 years, showing stability.')",
            "job_hopping_flag": "boolean (true if tenure is <1 year at multiple recent companies)",
            "relevant_domains": ["string (e.g., 'Finance', 'Healthcare', 'E-commerce')"]
          }},
          "education_analysis": {{
            "highest_degree": "string (e.g., 'M.S. in Computer Science')",
            "institution_tier": "string (e.g., 'Top-Tier', 'Well-Known', 'Standard', or 'Unknown')",
            "time_to_complete_flag": "boolean (true if time taken seems unusually long)"
          }},
          "skillset_evaluation": {{
            "hard_skills": ["string"],
            "soft_skills": ["string"],
            "certifications": ["string"]
          }},
          "positive_indicators": ["string (e.g., 'Clear career growth with promotions', 'Contributions to open-source projects', 'Quantifiable achievements with metrics like X% revenue increase')"],
          "red_flags": ["string (e.g., 'Unexplained employment gap between 2020-2021', 'Vague role descriptions lacking specific impact', 'Overuse of buzzwords without substance')"],
          "cultural_fit_summary": "string (A brief summary based on language used, e.g., 'Language suggests a collaborative and ownership-driven mindset.')",
          "personality_signals": ["string (e.g., 'Uses confident, action-oriented language', 'Focuses on team achievements')"]
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

            payload = { "contents": [{"parts": payload_parts}], "generationConfig": {"response_mime_type": "application/json"} }
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(api_url, data=data, headers={"Content-Type": "application/json"})
            
            with urllib.request.urlopen(req) as response:
                if response.status != 200:
                    return {"error": f"Gemini API Error {response.status}: {response.read().decode('utf-8')}"}
                result = json.loads(response.read().decode("utf-8"))
                return json.loads(result['candidates'][0]['content']['parts'][0]['text'])
        except Exception as e:
            return {"error": str(e)}

class ResumeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # --- MODIFIED: Ordering by score within the JSONField ---
        # The '->>' operator extracts a JSON field as text. We cast it to a float to sort numerically.
        # `nulls_last=True` ensures resumes without a score appear at the end.
        queryset = Resume.objects.annotate(
            score=Cast(models.F('scorecard_data__overall_score'), FloatField())
        ).order_by('-score', '-uploaded_on')
        
        search_term = self.request.query_params.get('search', None)
        if search_term:
            # You can still search by name or email
            queryset = queryset.filter(Q(name__icontains=search_term) | Q(email__icontains=search_term))
            
        return queryset

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

# --- REMOVED ---
# UpdateResumeView and CategoryListView are removed as they are no longer needed in this new design.
