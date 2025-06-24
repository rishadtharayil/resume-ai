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
import re

from django.db import models
from django.db.models import Q
from django.db.models.functions import Cast
from django.db.models import FloatField
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import ResumeSerializer, JobDescriptionSerializer
from .models import Resume, JobDescription

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

class JobDescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = JobDescriptionSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def get_queryset(self):
        if self.action in ['list', 'retrieve']:
            return JobDescription.objects.all().order_by('-created_at')
        
        user = self.request.user
        if user and user.is_authenticated:
            return JobDescription.objects.filter(created_by=user)
        return JobDescription.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AnalyzeResumeView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request, *args, **kwargs):
        if not GEMINI_API_KEY:
            return Response({"error": "Gemini API key is not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        pdf_file = request.FILES.get('file')
        job_id = request.data.get('job_description_id')
        job_text = ''

        if not pdf_file:
            return Response({"error": "No resume file provided."}, status=status.HTTP_400_BAD_REQUEST)

        job_description_instance = None
        if job_id:
            try:
                job_description_instance = JobDescription.objects.get(id=job_id)
                job_text = job_description_instance.description
            except JobDescription.DoesNotExist:
                return Response({"error": "Job Description not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if not job_text:
             return Response({"error": "No Job Description provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pdf_content = pdf_file.read()
            scorecard = self.generate_comparative_scorecard(pdf_content, job_text)

            if "error" in scorecard:
                return Response({"error": scorecard["error"]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            resume = Resume.objects.create(
                name=scorecard.get('basic_information', {}).get('name'),
                email=scorecard.get('basic_information', {}).get('email'),
                scorecard_data=scorecard,
                job_description=job_description_instance, 
                original_cv=pdf_file
            )
            
            serializer = ResumeSerializer(resume)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def generate_comparative_scorecard(self, pdf_content, job_description_text):
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={GEMINI_API_KEY}"
        
        # --- MODIFIED: Final, more robust prompt ---
        prompt = f"""
        You are a hiring analyst. Your only task is to analyze the provided resume against the job description and return a single, valid JSON object. Your response must be only the JSON, with no other text.

        **CRITICAL ANALYSIS RULES:**
        1.  **YOU MUST PROVIDE A `match_score`:** This score (1.0-10.0) must reflect the candidate's suitability. For example, a score of 75% should be returned as 7.5.
        2.  **HANDLE ALL RESUME TYPES:** If the resume lacks a standard "Work Experience" section, you MUST use the "Projects," "Internships," "Relevant Experience," and "Education" sections to populate the `experience_analysis` object. Do not return null for this field.
        3.  **POPULATE ALL FIELDS:** You must provide a value for every field in the required JSON structure.

        **Job Description to Analyze Against:**
        ---
        {job_description_text}
        ---

        **Required JSON Output Structure:**
        {{
          "match_score": "number",
          "summary": "string",
          "skill_gap_analysis": ["string"],
          "basic_information": {{ "name": "string", "email": "string", "phone": "string", "linkedin": "string" }},
          "experience_analysis": {{ "seniority_progression": ["string"], "tenure_summary": "string", "job_hopping_flag": "boolean", "relevant_domains": ["string"] }},
          "skillset_evaluation": {{ "hard_skills": ["string"], "soft_skills": ["string"], "certifications": ["string"] }},
          "positive_indicators": ["string"],
          "red_flags": ["string"],
          "cultural_fit_summary": "string",
          "personality_signals": ["string"]
        }}
        """
        
        payload_parts = [{"text": prompt}]
        
        try:
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            for page in doc:
                pix = page.get_pixmap(dpi=200)
                base64_image = base64.b64encode(pix.tobytes("png")).decode('utf-8')
                payload_parts.append({"inline_data": { "mime_type": "image/png", "data": base64_image }})

            payload = { "contents": [{"parts": payload_parts}], "generationConfig": {"response_mime_type": "application/json"} }
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(api_url, data=data, headers={"Content-Type": "application/json"})
            
            with urllib.request.urlopen(req) as response:
                if response.status != 200:
                    return {"error": f"Gemini API Error {response.status}: {response.read().decode('utf-8')}"}
                
                result = json.loads(response.read().decode("utf-8"))
                raw_text = result['candidates'][0]['content']['parts'][0]['text']
                
                match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                
                if not match:
                    return {"error": "Could not find a valid JSON object in the AI response."}
                
                json_string = match.group(0)
                scorecard = json.loads(json_string)

                # --- NEW: Score Normalization Safeguard ---
                # Check if the score is out of the 1-10 range and normalize it.
                if 'match_score' in scorecard and scorecard['match_score'] > 10:
                    scorecard['match_score'] /= 10.0
                
                return scorecard

        except json.JSONDecodeError as e:
            return {"error": f"Failed to decode JSON from AI response: {e}. Raw text was: '{raw_text}'"}
        except Exception as e:
            return {"error": str(e)}

class ResumeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Resume.objects.all()
        job_id = self.request.query_params.get('job_id')
        if job_id:
            queryset = queryset.filter(job_description__id=job_id)
        
        queryset = queryset.annotate(
            score=Cast(models.F('scorecard_data__match_score'), FloatField())
        ).order_by('-score', '-uploaded_on')
        
        return queryset

class BulkDeleteResumesView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, *args, **kwargs):
        ids_to_delete = request.data.get('ids', [])
        if not ids_to_delete: return Response({"error": "A list of 'ids' is required."}, status=status.HTTP_400_BAD_REQUEST)
        Resume.objects.filter(pk__in=ids_to_delete).delete()
        return Response({"message": f"Resumes deleted successfully."}, status=status.HTTP_200_OK)
