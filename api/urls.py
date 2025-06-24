# api/urls.py

from django.urls import path, include
# --- MODIFIED: Import new views ---
from .views import AnalyzeResumeView, ResumeViewSet, BulkDeleteResumesView, JobDescriptionViewSet
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# --- MODIFIED: Register new ViewSet ---
router.register(r'resumes', ResumeViewSet, basename='resume')
router.register(r'jobs', JobDescriptionViewSet, basename='job')


urlpatterns = [
    # --- MODIFIED: Renamed endpoint ---
    path('analyze-resume/', AnalyzeResumeView.as_view(), name='analyze-resume'),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    path('resumes/delete/', BulkDeleteResumesView.as_view(), name='resume-bulk-delete'),
    # --- The router now provides /api/jobs/ and /api/jobs/<id>/ ---
    path('', include(router.urls)),
]
