from django.contrib import admin
from .models import Quiz, Question


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'get_question_count')
    search_fields = ('title', 'source_text')
    inlines = [QuestionInline]

    def get_question_count(self, obj):
        return obj.questions.count()
    get_question_count.short_description = 'Questions'


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'quiz', 'correct_index')
    list_filter = ('quiz',)
    search_fields = ('text', 'explanation')
