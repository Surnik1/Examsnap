import json
import logging
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpRequest, HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from django.utils import timezone
from .models import Quiz, Question
from .services import generate_quiz_from_text, explain_answer_with_ai

logger = logging.getLogger(__name__)


@ensure_csrf_cookie
def index_view(request: HttpRequest) -> HttpResponse:
    """Renders the main ExamSnap single-page application dashboard."""
    recent_quizzes = Quiz.objects.order_by('-created_at')[:10]
    return render(request, 'quiz_app/index.html', {
        'recent_quizzes': recent_quizzes
    })


@csrf_exempt
@require_POST
def generate_quiz_api(request: HttpRequest) -> JsonResponse:
    """
    POST API endpoint to generate a quiz from lecture notes.
    Payload: {"notes_text": "..."}
    """
    try:
        try:
            data = json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            # Also support form-encoded data if needed
            data = request.POST

        notes_text = data.get('notes_text', '').strip()
        custom_instruction = data.get('custom_instruction', '').strip()

        try:
            num_questions = int(data.get('num_questions', 5))
            num_questions = max(1, num_questions)
        except (ValueError, TypeError):
            num_questions = 5

        if len(notes_text) < 10:
            return JsonResponse({
                'success': False,
                'error': 'Пожалуйста, введите более подробный конспект (минимум 10 символов).'
            }, status=400)

        # Generate quiz data via AI service or Zero-Fail fallback
        quiz_data = generate_quiz_from_text(
            notes_text,
            num_questions=num_questions,
            custom_instruction=custom_instruction
        )

        title = quiz_data.get('title', 'Конспект урока')
        questions_raw = quiz_data.get('questions', [])
        is_mock = quiz_data.get('is_mock', True)

        if not questions_raw:
            return JsonResponse({
                'success': False,
                'error': 'Не удалось сформировать вопросы из данного текста. Попробуйте другой фрагмент.'
            }, status=500)

        # Save to database
        quiz = Quiz.objects.create(
            title=title,
            source_text=notes_text
        )

        question_objs = [
            Question(
                quiz=quiz,
                text=q['text'],
                options=q['options'],
                correct_index=q['correct_index'],
                explanation=q.get('explanation', '')
            )
            for q in questions_raw
        ]
        created_questions = Question.objects.bulk_create(question_objs)

        saved_questions = [
            {
                'id': q.id,
                'text': q.text,
                'options': q.options,
                'correct_index': q.correct_index,
                'explanation': q.explanation,
            }
            for q in created_questions
        ]

        return JsonResponse({
            'success': True,
            'is_mock': is_mock,
            'quiz': {
                'id': quiz.id,
                'title': quiz.title,
                'source_text': quiz.source_text,
                'created_at': quiz.created_at.strftime("%d.%m.%Y %H:%M"),
                'questions_count': len(saved_questions),
                'questions': saved_questions
            }
        }, status=200)

    except Exception as e:
        logger.error(f"Error in generate_quiz_api: {e}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': f'Произошла непредвиденная ошибка: {str(e)}'
        }, status=500)


@require_GET
def quiz_history_api(request: HttpRequest) -> JsonResponse:
    """
    Returns list of recently generated quizzes.
    """
    quizzes = Quiz.objects.all().order_by('-created_at')[:20]
    data = []
    for q in quizzes:
        data.append({
            'id': q.id,
            'title': q.title,
            'created_at': q.created_at.strftime("%d.%m.%Y %H:%M"),
            'question_count': q.questions.count()
        })
    return JsonResponse({'quizzes': data}, status=200)


@require_GET
def get_quiz_api(request: HttpRequest, quiz_id: int) -> JsonResponse:
    """
    Returns the full questions and options for a past quiz to re-play it.
    """
    quiz = get_object_or_404(Quiz, id=quiz_id)
    questions = []
    for q in quiz.questions.all():
        questions.append({
            'id': q.id,
            'text': q.text,
            'options': q.options,
            'correct_index': q.correct_index,
            'explanation': q.explanation
        })

    return JsonResponse({
        'quiz': {
            'id': quiz.id,
            'title': quiz.title,
            'source_text': quiz.source_text,
            'is_mock': False,
            'created_at': quiz.created_at.strftime("%d.%m.%Y %H:%M"),
            'questions_count': len(questions),
            'questions': questions
        }
    }, status=200)


@csrf_exempt
@require_POST
def explain_answer_api(request: HttpRequest) -> JsonResponse:
    """
    POST API endpoint to get an in-depth AI explanation of an answer choice.
    Payload: {
        "question_text": "...",
        "selected_option": "...",
        "correct_option": "...",
        "is_correct": bool,
        "source_text": "..."
    }
    """
    try:
        try:
            data = json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            data = request.POST

        question_text = data.get('question_text', '').strip()
        selected_option = data.get('selected_option', '').strip()
        correct_option = data.get('correct_option', '').strip()
        is_correct = bool(data.get('is_correct', False))
        source_text = data.get('source_text', '').strip()

        explanation = explain_answer_with_ai(
            question_text=question_text,
            selected_option=selected_option,
            correct_option=correct_option,
            is_correct=is_correct,
            source_text=source_text
        )

        return JsonResponse({
            'success': True,
            'explanation': explanation
        }, status=200)
    except Exception as e:
        logger.error(f"Error in explain_answer_api: {e}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

