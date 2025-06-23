# api/urls.py

from django.urls import path, include
# --- MODIFIED ---
# Import the new CategoryListView
from .views import ExtractTextView, UpdateResumeView, ResumeViewSet, BulkDeleteResumesView, CategoryListView
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.routers import DefaultRouter


router = DefaultRouter()
router.register(r'resumes', ResumeViewSet, basename='resume')

urlpatterns = [
    path('extract-text/', ExtractTextView.as_view(), name='extract-text'),
    path('resume/<int:pk>/', UpdateResumeView.as_view(), name='update-resume'),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    
    # --- NEW URL ---
    # URL for fetching the list of unique categories
    path('categories/', CategoryListView.as_view(), name='category-list'),
    
    path('resumes/delete/', BulkDeleteResumesView.as_view(), name='resume-bulk-delete'),
    path('', include(router.urls)),
]
