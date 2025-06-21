# api/serializers.py

from rest_framework import serializers
from .models import Resume

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        # This will include all fields from your Resume model in the API response
        fields = '__all__'
        