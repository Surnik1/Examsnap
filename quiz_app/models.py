from django.db import models


class Quiz(models.Model):
    title = models.CharField(max_length=255)
    source_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Quizzes'

    def __str__(self):
        return self.title


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, related_name="questions", on_delete=models.CASCADE)
    text = models.TextField()
    options = models.JSONField(help_text="List of 4 string options")
    correct_index = models.IntegerField(help_text="Index of the correct option (0-3)")
    explanation = models.TextField(help_text="Explanation for why the answer is correct")

    def __str__(self):
        return f"{self.quiz.title} - {self.text[:50]}"
