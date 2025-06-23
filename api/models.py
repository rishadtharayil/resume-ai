from django.db import models

class Resume(models.Model):
    # Basic info that we want to be able to search/filter easily.
    name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    
    # --- NEW: scorecard_data ---
    # This single field will store the entire detailed JSON object
    # returned by the AI, containing all analysis, ratings, flags, etc.
    scorecard_data = models.JSONField(null=True, blank=True)

    # --- REMOVED ---
    # The individual fields like skills, experience, rating, categories, etc.,
    # are now part of the scorecard_data JSON object.
    
    # File and timestamp information remains.
    original_cv = models.FileField(upload_to='resumes/', null=True, blank=True, help_text="Upload the original CV file")
    uploaded_on = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Use the name from the scorecard data if available.
        if self.scorecard_data and 'basic_information' in self.scorecard_data:
            return self.scorecard_data['basic_information'].get('name', f"Resume {self.id}")
        return self.name or f"Resume {self.id}"

