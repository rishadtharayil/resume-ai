# api/urls.py

from django.urls import path, include
from .views import AnalyzeResumeView, ResumeViewSet, BulkDeleteResumesView, JobDescriptionViewSet, UpdateResumeStatusView
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'resumes', ResumeViewSet, basename='resume')
router.register(r'jobs', JobDescriptionViewSet, basename='job')


urlpatterns = [
    path('analyze-resume/', AnalyzeResumeView.as_view(), name='analyze-resume'),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    path('resumes/delete/', BulkDeleteResumesView.as_view(), name='resume-bulk-delete'),
    
    # --- NEW: URL for updating status ---
    path('resumes/<int:pk>/update-status/', UpdateResumeStatusView.as_view(), name='update-resume-status'),
    
    path('', include(router.urls)),
]
