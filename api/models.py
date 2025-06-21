from django.db import models

# Create your models here.
class Resume(models.Model):
    name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)

    skills = models.TextField(null=True, blank=True, help_text="Comma-separated skills")
    experience = models.TextField(null=True, blank=True)
    education = models.TextField(null=True, blank=True)

    projects = models.TextField(null=True, blank=True) 

    original_cv = models.FileField(upload_to='resumes/', null=True, blank=True, help_text="Upload the original CV file")
    uploaded_on = models.DateTimeField(auto_now_add=True)

    def str(self):
        return self.name or f"Resume {self.id}"
