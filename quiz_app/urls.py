from django.urls import path
from . import views

app_name = 'quiz_app'

urlpatterns = [
    path('', views.index_view, name='index'),
    path('api/generate/', views.generate_quiz_api, name='generate_quiz_api'),
    path('api/explain_answer/', views.explain_answer_api, name='explain_answer_api'),
    path('api/history/', views.quiz_history_api, name='quiz_history_api'),
    path('api/quiz/<int:quiz_id>/', views.get_quiz_api, name='get_quiz_api'),
]

