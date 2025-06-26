# api/serializers.py

from rest_framework import serializers
from .models import Resume, JobDescription

class JobDescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobDescription
        fields = ['id', 'title', 'description', 'created_at']


class ResumeSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job_description.title', read_only=True)

    class Meta:
        model = Resume
        # --- MODIFIED: Added 'status' ---
        fields = ['id', 'name', 'email', 'status', 'scorecard_data', 'original_cv', 'uploaded_on', 'job_description', 'job_title']
        extra_kwargs = {
            'job_description': {'required': False}
        }
