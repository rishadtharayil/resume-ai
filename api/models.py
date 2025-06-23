from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"


class Resume(models.Model):
    name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)

    skills = models.TextField(null=True, blank=True, help_text="Comma-separated skills")
    experience = models.TextField(null=True, blank=True)
    education = models.TextField(null=True, blank=True)
    projects = models.TextField(null=True, blank=True) 
    
    categories = models.ManyToManyField(Category, blank=True, related_name='resumes')

    # --- NEW FIELD ---
    # To store the AI-generated rating for the candidate.
    rating = models.IntegerField(null=True, blank=True, help_text="AI-generated rating from 1 to 10")

    original_cv = models.FileField(upload_to='resumes/', null=True, blank=True, help_text="Upload the original CV file")
    uploaded_on = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name or f"Resume {self.id}"
