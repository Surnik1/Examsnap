import json
from django.test import TestCase, Client
from django.urls import reverse
from .models import Quiz, Question
from .services import generate_quiz_from_text


class ExamSnapTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_index_view(self):
        """Verify the main dashboard loads successfully."""
        response = self.client.get(reverse('quiz_app:index'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'ExamSnap')
        self.assertContains(response, 'Конспект урока или учебника')
        self.assertContains(response, '11th Grade')

    def test_presentation_view(self):
        """Verify the 8-slide presentation page loads successfully."""
        response = self.client.get(reverse('quiz_app:presentation'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'ExamSnap')
        self.assertContains(response, 'Слайд 1 из 8')

    def test_generate_quiz_validation_too_short(self):
        """Input under 10 characters should return 400 error."""
        response = self.client.post(
            reverse('quiz_app:generate_quiz_api'),
            data=json.dumps({'notes_text': 'кратко'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data.get('success'))
        self.assertIn('error', data)

    def test_generate_quiz_biology_preset(self):
        """Verify biology fallback generation and DB persistence."""
        note = "Фотосинтез происходит в хлоропластах растений при участии хлорофилла и выделяет кислород."
        response = self.client.post(
            reverse('quiz_app:generate_quiz_api'),
            data=json.dumps({'notes_text': note}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get('success'))
        self.assertIn('quiz', data)

        quiz_dict = data['quiz']
        self.assertTrue(len(quiz_dict['title']) > 0)
        self.assertEqual(len(quiz_dict['questions']), 5)

        # Check database records
        quiz = Quiz.objects.get(id=quiz_dict['id'])
        self.assertEqual(quiz.questions.count(), 5)
        first_q = quiz.questions.first()
        self.assertEqual(len(first_q.options), 4)
        self.assertIn(first_q.correct_index, [0, 1, 2, 3])
        self.assertTrue(len(first_q.explanation) > 10)

    def test_generate_quiz_informatics_preset(self):
        """Verify informatics/python generation."""
        note = "Алгоритмы сортировки и язык программирования Python. Бинарный поиск O(log n) и кортежи tuple."
        response = self.client.post(
            reverse('quiz_app:generate_quiz_api'),
            data=json.dumps({'notes_text': note}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get('success'))
        self.assertTrue(len(data['quiz']['title']) > 0)
        self.assertEqual(len(data['quiz']['questions']), 5)

    def test_generate_quiz_history_preset(self):
        """Verify history generation."""
        note = "Вторая мировая война и Великая Отечественная война 1941-1945. Сталинградская битва."
        response = self.client.post(
            reverse('quiz_app:generate_quiz_api'),
            data=json.dumps({'notes_text': note}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get('success'))
        self.assertTrue(len(data['quiz']['title']) > 0)
        self.assertEqual(len(data['quiz']['questions']), 5)

    def test_generate_quiz_generic_fallback(self):
        """Verify smart generic fallback on unfamiliar text."""
        note = "Экономика изучает производство, распределение и потребление благ в условиях ограниченности ресурсов. Закон спроса и предложения формирует равновесную цену на рынке."
        response = self.client.post(
            reverse('quiz_app:generate_quiz_api'),
            data=json.dumps({'notes_text': note}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get('success'))
        self.assertEqual(len(data['quiz']['questions']), 5)

    def test_quiz_history_and_get_quiz_apis(self):
        """Verify fetching history and getting past quiz by id."""
        # Create a quiz first
        note = "Второй закон Ньютона определяет ускорение через силу и массу тела в классической физике."
        gen_resp = self.client.post(
            reverse('quiz_app:generate_quiz_api'),
            data=json.dumps({'notes_text': note}),
            content_type='application/json'
        )
        quiz_id = gen_resp.json()['quiz']['id']

        # Fetch history
        hist_resp = self.client.get(reverse('quiz_app:quiz_history_api'))
        self.assertEqual(hist_resp.status_code, 200)
        hist_data = hist_resp.json()
        self.assertTrue(len(hist_data['quizzes']) >= 1)
        self.assertEqual(hist_data['quizzes'][0]['id'], quiz_id)

        # Fetch quiz detail
        detail_resp = self.client.get(reverse('quiz_app:get_quiz_api', kwargs={'quiz_id': quiz_id}))
        self.assertEqual(detail_resp.status_code, 200)
        detail_data = detail_resp.json()
        self.assertEqual(detail_data['quiz']['id'], quiz_id)
        self.assertEqual(len(detail_data['quiz']['questions']), 5)

        # 404 for non-existent quiz
        not_found_resp = self.client.get(reverse('quiz_app:get_quiz_api', kwargs={'quiz_id': 999999}))
        self.assertEqual(not_found_resp.status_code, 404)

    def test_generate_quiz_custom_question_count(self):
        """Verify generating 3 and 7 questions according to user selection."""
        note = "Фотосинтез в тилакоидах хлоропластов преобразует энергию света в глюкозу и выделяет кислород."

        # Request 3 questions
        resp_3 = self.client.post(
            reverse('quiz_app:generate_quiz_api'),
            data=json.dumps({'notes_text': note, 'num_questions': 3}),
            content_type='application/json'
        )
        self.assertEqual(resp_3.status_code, 200)
        self.assertEqual(len(resp_3.json()['quiz']['questions']), 3)

        # Request 7 questions
        resp_7 = self.client.post(
            reverse('quiz_app:generate_quiz_api'),
            data=json.dumps({'notes_text': note, 'num_questions': 7}),
            content_type='application/json'
        )
        self.assertEqual(resp_7.status_code, 200)
        self.assertEqual(len(resp_7.json()['quiz']['questions']), 7)

