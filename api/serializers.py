# api/serializers.py

from rest_framework import serializers
from .models import Resume

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        # The serializer will now automatically handle the name, email,
        # scorecard_data, original_cv, and uploaded_on fields.
        fields = '__all__'
