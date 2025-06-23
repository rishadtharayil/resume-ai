# api/urls.py

from django.urls import path, include
from .views import ExtractTextView, ResumeViewSet, BulkDeleteResumesView
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.routers import DefaultRouter


router = DefaultRouter()
router.register(r'resumes', ResumeViewSet, basename='resume')

urlpatterns = [
    path('extract-text/', ExtractTextView.as_view(), name='extract-text'),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    path('resumes/delete/', BulkDeleteResumesView.as_view(), name='resume-bulk-delete'),
    path('', include(router.urls)),
]

# --- REMOVED ---
# The URLs for 'update-resume' and 'categories' are no longer needed.
