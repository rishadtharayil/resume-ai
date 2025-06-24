# api/serializers.py

from rest_framework import serializers
# --- MODIFIED: Import new model ---
from .models import Resume, JobDescription

# --- NEW: JobDescription Serializer ---
class JobDescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobDescription
        fields = ['id', 'title', 'description', 'created_at']


class ResumeSerializer(serializers.ModelSerializer):
    # Include job description title for context
    job_title = serializers.CharField(source='job_description.title', read_only=True)

    class Meta:
        model = Resume
        # --- MODIFIED: Add job_title to fields ---
        fields = ['id', 'name', 'email', 'scorecard_data', 'original_cv', 'uploaded_on', 'job_description', 'job_title']
        # Make job_description writeable but not required
        extra_kwargs = {
            'job_description': {'required': False}
        }
