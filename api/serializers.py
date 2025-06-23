# api/serializers.py

from rest_framework import serializers
# --- MODIFIED ---
# Import both Resume and the new Category model
from .models import Resume, Category

class ResumeSerializer(serializers.ModelSerializer):
    # --- NEW FIELD ---
    # This field will represent the many-to-many relationship as a list of category names (strings).
    # It's more efficient and easier for the frontend to consume than nested objects.
    categories = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = Resume
        # This will include all fields from your Resume model in the API response,
        # including our new 'categories' field.
        fields = '__all__'
