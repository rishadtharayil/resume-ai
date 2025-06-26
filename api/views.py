# api/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.pagination import PageNumberPagination
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

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class JobDescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = JobDescriptionSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def get_queryset(self):
        queryset = JobDescription.objects.all().order_by('-created_at')
        
        search_term = self.request.query_params.get('search', None)
        if search_term:
            queryset = queryset.filter(
                Q(title__icontains=search_term) |
                Q(description__icontains=search_term)
            )

        if self.action not in ['list', 'retrieve']:
            user = self.request.user
            if user and user.is_authenticated:
                return queryset.filter(created_by=user)
            return JobDescription.objects.none()
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AnalyzeResumeView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request, *args, **kwargs):
        if not GEMINI_API_KEY:
            return Response({"error": "Gemini API key is not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        pdf_file = request.FILES.get('file')
        job_id = request.data.get('job_description_id')
        
        if not pdf_file:
            return Response({"error": "No resume file provided."}, status=status.HTTP_400_BAD_REQUEST)

        job_description_instance = None
        job_text = ''
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
        
        prompt = f"""
        Analyze the following resume against the provided job description. Your only output must be a single, valid JSON object that strictly follows the requested structure. Do not include any text, explanations, or markdown formatting outside of the JSON object.

        **Job Description:**
        ---
        {job_description_text}
        ---

        **Required JSON Output Structure:**
        {{
          "match_score": "number", "summary": "string", "skill_gap_analysis": ["string"],
          "basic_information": {{ "name": "string", "email": "string", "phone": "string", "linkedin": "string" }},
          "experience_analysis": {{ "seniority_progression": ["string"], "tenure_summary": "string", "job_hopping_flag": "boolean", "relevant_domains": ["string"] }},
          "skillset_evaluation": {{ "hard_skills": ["string"], "soft_skills": ["string"], "certifications": ["string"] }},
          "positive_indicators": ["string"], "red_flags": ["string"], "cultural_fit_summary": "string", "personality_signals": ["string"]
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
                
                # Robust JSON extraction:
                # The AI is instructed to return only a JSON object, but sometimes
                # it might include extra text or wrap the JSON in markdown.
                try:
                    # Attempt to parse the first valid JSON object from the raw text
                    decoder = json.JSONDecoder()
                    scorecard, end_index = decoder.raw_decode(raw_text.strip())
                    
                    # Optional: Log or handle if there's extra data after the first JSON object
                    remaining_text = raw_text.strip()[end_index:].strip()
                    if remaining_text:
                        print(f"Warning: Gemini API response contained extra data after JSON: '{remaining_text}'")

                except json.JSONDecodeError as e:
                    # If raw_decode fails, it means the text doesn't start with a valid JSON object
                    # or is malformed. Try to find a JSON block wrapped in markdown,
                    # which is a common LLM output format.
                    markdown_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_text, re.DOTALL)
                    if markdown_match:
                        scorecard = json.loads(markdown_match.group(1))
                    else:
                        # If no markdown block found, or markdown parsing failed,
                        # and raw_decode also failed, then the response is genuinely problematic.
                        return {"error": f"Failed to decode JSON from AI response: {e}. Raw text was: '{raw_text}'"}

                if 'match_score' in scorecard and isinstance(scorecard['match_score'], (int, float)) and scorecard['match_score'] > 10:
                    scorecard['match_score'] /= 10.0
                
                return scorecard

        except json.JSONDecodeError as e:
            # This outer catch is for the initial json.loads(response.read().decode("utf-8"))
            # if the Gemini API's overall response structure is not valid JSON.
            # To ensure 'raw_text' is available for debugging, it's better to store the full response.
            # Note: response.read() can only be called once.
            return {"error": f"Failed to decode JSON from Gemini API's overall response: {e}. Raw response was: '{response.read().decode('utf-8')}'"}
        except Exception as e:
            return {"error": str(e)}

class ResumeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Resume.objects.all()
        job_id = self.request.query_params.get('job_id')
        if job_id:
            queryset = queryset.filter(job_description__id=job_id)
        
        sort_by = self.request.query_params.get('sort_by', '-score')
        
        if sort_by == '-score':
            queryset = queryset.annotate(
                score=Cast(models.F('scorecard_data__match_score'), FloatField())
            ).order_by('-score', '-uploaded_on')
        elif sort_by == 'name':
            queryset = queryset.order_by('name')
        elif sort_by == '-uploaded_on':
            queryset = queryset.order_by('-uploaded_on')
        
        return queryset

# --- RESTORED: View for updating resume status ---
class UpdateResumeStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        try:
            resume = Resume.objects.get(pk=pk)
        except Resume.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'Status field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        valid_statuses = [choice[0] for choice in Resume.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status provided.'}, status=status.HTTP_400_BAD_REQUEST)
            
        resume.status = new_status
        resume.save()
        serializer = ResumeSerializer(resume)
        return Response(serializer.data)


class BulkDeleteResumesView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, *args, **kwargs):
        ids_to_delete = request.data.get('ids', [])
        if not ids_to_delete: return Response({"error": "A list of 'ids' is required."}, status=status.HTTP_400_BAD_REQUEST)
        Resume.objects.filter(pk__in=ids_to_delete).delete()
        return Response({"message": f"Resumes deleted successfully."}, status=status.HTTP_200_OK)
