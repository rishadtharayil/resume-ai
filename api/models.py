from django.db import models
# --- NEW: Import the User model ---
from django.contrib.auth.models import User

# --- NEW: JobDescription Model ---
class JobDescription(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    # Link to the employer who posted the job
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Resume(models.Model):
    name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    scorecard_data = models.JSONField(null=True, blank=True)
    
    # --- MODIFIED: Link resume to a specific job description ---
    # This can be null if a resume is uploaded without a specific job in mind.
    job_description = models.ForeignKey(JobDescription, on_delete=models.SET_NULL, null=True, blank=True, related_name='resumes')

    original_cv = models.FileField(upload_to='resumes/', null=True, blank=True, help_text="Upload the original CV file")
    uploaded_on = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.scorecard_data and 'basic_information' in self.scorecard_data:
            return self.scorecard_data['basic_information'].get('name', f"Resume {self.id}")
        return self.name or f"Resume {self.id}"
