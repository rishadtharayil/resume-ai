# api/urls.py

from django.urls import path
from .views import ExtractTextView, UpdateResumeView
from rest_framework.authtoken.views import obtain_auth_token

from rest_framework.routers import DefaultRouter
from .views import ResumeViewSet, BulkDeleteResumesView
from django.urls import include


# This creates the router
router = DefaultRouter()
# Register the ResumeViewSet with the router
router.register(r'resumes', ResumeViewSet, basename='resume')
urlpatterns = [
    path('extract-text/', ExtractTextView.as_view(), name='extract-text'),
    path('resume/<int:pk>/', UpdateResumeView.as_view(), name='update-resume'),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),

    path('resumes/delete/', BulkDeleteResumesView.as_view(), name='resume-bulk-delete'),

    path('', include(router.urls)),
]