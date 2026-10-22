/**
 * ExamSnap - Interactive Quiz Player & AI Quiz Generation Logic
 */

document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------------------------
    // 1. Presets Data (Concise ~150-word lecture notes for 90-sec live demo)
    // -------------------------------------------------------------------------
    const PRESETS = {
        biology: `Фотосинтез — процесс преобразования энергии видимого света в химическую энергию органических веществ при участии хлорофилла a и b. Процесс протекает в растительных клетках внутри двумембранных органелл — хлоропластов. Фотосинтез разделяется на две фазы: световую и темновую.

Световая фаза протекает на мембранах тилакоидов хлоропластов при наличии квантов света. Здесь происходит фотолиз воды (H₂O) в фотосистеме II, в результате которого выделяется молекулярный кислород (O₂). Одновременно за счет протонов водорода и АТФ-синтазы образуется АТФ, а кофермент НАДФ+ восстанавливается до НАДФН.

Темновая фаза (цикл Кальвина) происходит в строме хлоропласта независимо от прямого освещения. Углекислый газ (CO₂) связывается при участии фермента Рубиско, и за счет накопленных молекул АТФ и НАДФН синтезируется глюкоза (C₆H₁₂O₆). Из глюкозы затем образуются крахмал и целлюлоза.`,

        informatics: `В информатике алгоритм — это точная и понятная инструкция исполнителю совершить последовательность действий для достижения цели за конечное число шагов. Сложность алгоритмов оценивается в нотации «О-большое» (Big O). Линейный поиск имеет сложность O(n), а бинарный поиск в отсортированном массиве требует O(log n) операций.

Сортировка слиянием (Merge Sort) использует принцип «разделяй и властвуй» и гарантирует сложность O(n log n). В языке программирования Python типы данных делятся на изменяемые (mutable) и неизменяемые (immutable). Кортежи (tuple), числа и строки неизменяемы, а списки (list), словари (dict) и множества (set) изменяемы.

Генераторы списков (list comprehensions) позволяют создавать коллекции компактно, например: [x**2 for x in range(4)]. Функции-генераторы с ключевым словом yield отдают значения порциями, оптимизируя расход оперативной памяти.`,

        history: `Великая Отечественная война (1941–1945) — важнейшая составная часть Второй мировой войны. 22 июня 1941 года гитлеровская Германия вероломно напала на СССР по плану «Барбаросса». Героизм защитников Брестской крепости и Смоленское сражение сорвали планы молниеносной войны.

В декабре 1941 года контрнаступление под Москвой развеяло миф о непобедимости вермахта. Коренной перелом в войне начался с победы в Сталинградской битве (1942–1943 гг.), где была окружена армия Паулюса. Летом 1943 года в Курской битве под Прохоровкой произошло грандиозное танковое сражение, закрепившее стратегическую инициативу.

Летом 1944 года победоносная операция «Багратион» привела к освобождению Белорусской ССР. В феврале 1945 года на Ялтинской (Крымской) конференции главы СССР, США и Великобритании согласовали планы разгрома врага и принципы создания ООН.`
    };

    // -------------------------------------------------------------------------
    // 2. DOM Elements
    // -------------------------------------------------------------------------
    const notesTextarea = document.getElementById('notes-textarea');
    const charCounter = document.getElementById('char-counter');
    const btnGenerate = document.getElementById('btn-generate');
    const btnGenerateText = document.getElementById('btn-generate-text');
    const generateSpinner = document.getElementById('generate-spinner');
    const btnClearInput = document.getElementById('btn-clear-input');
    const inputError = document.getElementById('input-error');
    const inputErrorMsg = document.getElementById('input-error-msg');

    // Sections
    const inputSection = document.getElementById('input-section');
    const quizPlayerSection = document.getElementById('quiz-player-section');
    const resultsSection = document.getElementById('results-section');

    // Quiz Player Elements
    const quizTitle = document.getElementById('quiz-title');
    const quizTopicBadge = document.getElementById('quiz-topic-badge');
    const quizSourceBadge = document.getElementById('quiz-source-badge');
    const quizProgressText = document.getElementById('quiz-progress-text');
    const quizScoreLive = document.getElementById('quiz-score-live');
    const quizProgressBar = document.getElementById('quiz-progress-bar');
    const currentQuestionTag = document.getElementById('current-question-tag');
    const currentQuestionText = document.getElementById('current-question-text');
    const optionsContainer = document.getElementById('options-container');
    const explanationBox = document.getElementById('explanation-box');
    const explanationTitle = document.getElementById('explanation-title');
    const explanationText = document.getElementById('explanation-text');
    const explanationIcon = document.getElementById('explanation-icon');
    const aiExplanationContainer = document.getElementById('ai-explanation-container');
    const aiExplanationStatus = document.getElementById('ai-explanation-status');
    const aiExplanationLoading = document.getElementById('ai-explanation-loading');
    const aiExplanationContent = document.getElementById('ai-explanation-content');
    const btnNextQuestion = document.getElementById('btn-next-question');
    const btnNextText = document.getElementById('btn-next-text');
    const btnBackToInput = document.getElementById('btn-back-to-input');

    // Results Elements
    const resultEmoji = document.getElementById('result-emoji');
    const resultHeadline = document.getElementById('result-headline');
    const resultSubtext = document.getElementById('result-subtext');
    const statCorrect = document.getElementById('stat-correct');
    const statPercent = document.getElementById('stat-percent');
    const statTotal = document.getElementById('stat-total');
    const btnRetakeQuiz = document.getElementById('btn-retake-quiz');
    const btnNewQuizFromResult = document.getElementById('btn-new-quiz-from-result');
    const btnToggleReview = document.getElementById('btn-toggle-review');
    const fullReviewContainer = document.getElementById('full-review-container');
    const reviewCardsList = document.getElementById('review-cards-list');

    // History
    const historyList = document.getElementById('history-list');
    const historyCountBadge = document.getElementById('history-count-badge');

    // -------------------------------------------------------------------------
    // 3. Quiz State & Question Count
    // -------------------------------------------------------------------------
    let currentQuiz = null;
    let currentIndex = 0;
    let score = 0;
    let answeredQuestions = []; // store each question's user choice, isCorrect, etc.
    let selectedQuestionCount = 5;

    const questionCountLabel = document.getElementById('question-count-label');
    const customCountInput = document.getElementById('custom-count-input');

    const COUNT_LABELS = {
        3: '3 вопроса (Экспресс)',
        5: '5 вопросов (Стандарт)',
        10: '10 вопросов (Экзамен)',
        50: '50 вопросов (Супер-тест)'
    };

    if (customCountInput) {
        customCountInput.addEventListener('input', () => {
            const val = parseInt(customCountInput.value, 10);
            if (!isNaN(val) && val > 0) {
                selectedQuestionCount = val;
                // Deselect buttons
                document.querySelectorAll('.q-count-btn').forEach(b => {
                    b.className = 'q-count-btn p-2 rounded-lg text-xs font-semibold border transition-all text-center bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500/60 hover:text-white';
                });
                if (questionCountLabel) {
                    questionCountLabel.textContent = `${selectedQuestionCount} вопр. (Пользовательское число)`;
                }
                if (!btnGenerate.disabled) {
                    btnGenerateText.textContent = `🚀 Сгенерировать тест (${selectedQuestionCount} вопр.) за 5 сек`;
                }
            } else if (!customCountInput.value) {
                selectedQuestionCount = 5;
                const defaultBtn = document.querySelector('.q-count-btn[data-count="5"]');
                if (defaultBtn) {
                    defaultBtn.className = 'q-count-btn p-2 rounded-lg text-xs font-semibold border transition-all text-center bg-indigo-600/30 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/40';
                }
                if (questionCountLabel) {
                    questionCountLabel.textContent = COUNT_LABELS[5];
                }
                if (!btnGenerate.disabled) {
                    btnGenerateText.textContent = `🚀 Сгенерировать тест (5 вопр.) за 5 сек`;
                }
            }
        });
    }

    document.querySelectorAll('.q-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedQuestionCount = parseInt(btn.dataset.count, 10) || 5;
            if (customCountInput) {
                customCountInput.value = '';
            }
            document.querySelectorAll('.q-count-btn').forEach(b => {
                b.className = 'q-count-btn p-2 rounded-lg text-xs font-semibold border transition-all text-center bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500/60 hover:text-white';
            });
            btn.className = 'q-count-btn p-2 rounded-lg text-xs font-semibold border transition-all text-center bg-indigo-600/30 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/40';
            if (questionCountLabel) {
                questionCountLabel.textContent = COUNT_LABELS[selectedQuestionCount] || `${selectedQuestionCount} вопросов`;
            }
            if (!btnGenerate.disabled) {
                btnGenerateText.textContent = `🚀 Сгенерировать тест (${selectedQuestionCount} вопр.) за 5 сек`;
            }
        });
    });

    // -------------------------------------------------------------------------
    // 4. Input & Preset Handlers
    // -------------------------------------------------------------------------
    function updateCharCount() {
        const len = notesTextarea.value.length;
        charCounter.textContent = `${len} символов`;
        if (len > 0 && len < 10) {
            charCounter.classList.add('text-amber-400');
            charCounter.classList.remove('text-slate-500');
        } else {
            charCounter.classList.remove('text-amber-400');
            charCounter.classList.add('text-slate-500');
        }
    }

    notesTextarea.addEventListener('input', () => {
        updateCharCount();
        hideError();
    });

    btnClearInput.addEventListener('click', () => {
        notesTextarea.value = '';
        updateCharCount();
        hideError();
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('ring-2', 'ring-indigo-500'));
        notesTextarea.focus();
    });

    // Preset Buttons Click
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.dataset.preset;
            if (PRESETS[presetKey]) {
                notesTextarea.value = PRESETS[presetKey].trim();
                updateCharCount();
                hideError();

                // Highlight active preset button
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('ring-2', 'ring-indigo-500'));
                btn.classList.add('ring-2', 'ring-indigo-500');

                // Smooth scroll to generate button on mobile
                btnGenerate.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    });

    function showError(msg) {
        inputErrorMsg.textContent = msg;
        inputError.classList.remove('hidden');
    }

    function hideError() {
        inputError.classList.add('hidden');
    }

    // -------------------------------------------------------------------------
    // 5. Generate Quiz API Call
    // -------------------------------------------------------------------------
    btnGenerate.addEventListener('click', async () => {
        const notes = notesTextarea.value.trim();
        if (notes.length < 10) {
            showError('Пожалуйста, введи более подробный конспект (минимум 10 символов) или нажми на любой готовый пресет выше.');
            notesTextarea.focus();
            return;
        }

        hideError();
        setLoading(true);

        try {
            const response = await fetch('/api/generate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    notes_text: notes,
                    num_questions: selectedQuestionCount
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Ошибка при генерации теста.');
            }

            // Successfully received quiz data
            currentQuiz = data.quiz;
            currentQuiz.is_mock = data.is_mock;

            // Prepend to sidebar history
            addQuizToHistorySidebar(currentQuiz);

            // Start quiz player
            startQuiz(currentQuiz);

        } catch (err) {
            console.error('Generation error:', err);
            showError(err.message || 'Сбой подключения к серверу. Попробуйте еще раз.');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        btnGenerate.disabled = isLoading;
        if (isLoading) {
            generateSpinner.classList.remove('hidden');
            btnGenerateText.textContent = `⏳ Анализируем конспект и создаем ${selectedQuestionCount} вопросов...`;
            btnGenerate.classList.add('opacity-80', 'cursor-wait');
        } else {
            generateSpinner.classList.add('hidden');
            btnGenerateText.textContent = `🚀 Сгенерировать тест (${selectedQuestionCount} вопр.) за 5 сек`;
            btnGenerate.classList.remove('opacity-80', 'cursor-wait');
        }
    }

    // -------------------------------------------------------------------------
    // 6. Interactive Quiz Player
    // -------------------------------------------------------------------------
    function startQuiz(quiz) {
        currentQuiz = quiz;
        currentIndex = 0;
        score = 0;
        answeredQuestions = [];

        // Show player, hide input & results
        inputSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        quizPlayerSection.classList.remove('hidden');

        // Setup Quiz Info
        quizTitle.textContent = quiz.title || 'Тест по конспекту';
        if (quiz.is_mock) {
            quizSourceBadge.textContent = '🛡️ Zero-Fail Demo Mode';
            quizSourceBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20';
        } else {
            quizSourceBadge.textContent = '✨ Gemini AI';
            quizSourceBadge.className = 'px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        }

        renderCurrentQuestion();

        // Smooth scroll to top of quiz player
        quizPlayerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function formatAiExplanation(rawText) {
        if (!rawText) return '';
        let escaped = escapeHtml(rawText);
        // Replace bold markdown **text** with strong tag
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
        // Split paragraphs
        const paragraphs = escaped.split(/\n\n+/);
        return paragraphs.map(p => {
            const lineHtml = p.replace(/\n/g, '<br>');
            return `<div class="mb-2 leading-relaxed text-slate-200">${lineHtml}</div>`;
        }).join('');
    }

    function renderCurrentQuestion() {
        const total = currentQuiz.questions.length;
        const q = currentQuiz.questions[currentIndex];

        // Update progress bar & counters
        const progressPercent = Math.round(((currentIndex + 1) / total) * 100);
        quizProgressText.textContent = `Вопрос ${currentIndex + 1} из ${total}`;
        quizProgressBar.style.width = `${progressPercent}%`;
        quizScoreLive.textContent = `Верно: ${score} / ${currentIndex}`;
        currentQuestionTag.textContent = `Вопрос ${currentIndex + 1} из ${total}`;
        currentQuestionText.textContent = q.text;

        // Reset explanation box and next button
        explanationBox.classList.add('hidden');
        explanationBox.className = 'hidden mb-6 p-4 sm:p-5 rounded-xl border transition-all duration-300';
        btnNextQuestion.classList.add('hidden');

        // Reset AI detailed explanation box
        if (aiExplanationContainer) {
            aiExplanationContainer.classList.add('hidden');
            if (aiExplanationLoading) aiExplanationLoading.classList.remove('hidden');
            if (aiExplanationContent) {
                aiExplanationContent.classList.add('hidden');
                aiExplanationContent.innerHTML = '';
            }
            if (aiExplanationStatus) aiExplanationStatus.textContent = '';
        }

        // Render options buttons (A, B, C, D)
        const letters = ['A', 'B', 'C', 'D'];
        optionsContainer.innerHTML = '';

        q.options.forEach((optText, optIdx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'option-btn w-full p-4 text-left rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-indigo-500/60 transition-all duration-200 flex items-center justify-between group cursor-pointer';
            
            btn.innerHTML = `
                <div class="flex items-start space-x-3.5 pr-2">
                    <span class="option-badge w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-indigo-600/40 group-hover:text-indigo-200 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700 transition-colors">
                        ${letters[optIdx] || optIdx + 1}
                    </span>
                    <span class="option-text text-sm sm:text-base text-slate-200 font-medium group-hover:text-white transition-colors leading-relaxed">
                        ${escapeHtml(optText)}
                    </span>
                </div>
                <div class="option-status-icon shrink-0 pl-2"></div>
            `;

            btn.addEventListener('click', () => handleOptionSelect(optIdx, btn));
            optionsContainer.appendChild(btn);
        });
    }

    function handleOptionSelect(selectedIndex, selectedBtn) {
        const q = currentQuiz.questions[currentIndex];
        const total = currentQuiz.questions.length;
        const isCorrect = (selectedIndex === q.correct_index);

        // Record student's choice
        answeredQuestions.push({
            questionIndex: currentIndex,
            questionText: q.text,
            options: q.options,
            selectedIndex: selectedIndex,
            correctIndex: q.correct_index,
            isCorrect: isCorrect,
            explanation: q.explanation
        });

        if (isCorrect) {
            score++;
        }
        quizScoreLive.textContent = `Верно: ${score} / ${currentIndex + 1}`;

        // Disable all option buttons
        const optionButtons = optionsContainer.querySelectorAll('.option-btn');
        optionButtons.forEach((btn, idx) => {
            btn.disabled = true;
            btn.classList.remove('hover:bg-slate-800/90', 'hover:border-indigo-500/60', 'cursor-pointer');
            btn.classList.add('cursor-default');

            const statusIcon = btn.querySelector('.option-status-icon');
            const badge = btn.querySelector('.option-badge');

            if (idx === q.correct_index) {
                // Highlight Correct Option (Green)
                btn.classList.add('bg-emerald-950/40', 'border-emerald-500', 'text-emerald-200');
                btn.classList.remove('bg-slate-900/90', 'border-slate-700/80');
                badge.classList.add('bg-emerald-500', 'text-slate-950', 'border-emerald-400');
                badge.classList.remove('bg-slate-800', 'text-slate-300', 'border-slate-700');
                statusIcon.innerHTML = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">✓</span>`;
            } else if (idx === selectedIndex && !isCorrect) {
                // Highlight Wrong Option (Red)
                btn.classList.add('bg-rose-950/40', 'border-rose-500', 'text-rose-200');
                btn.classList.remove('bg-slate-900/90', 'border-slate-700/80');
                badge.classList.add('bg-rose-500', 'text-white', 'border-rose-400');
                badge.classList.remove('bg-slate-800', 'text-slate-300', 'border-slate-700');
                statusIcon.innerHTML = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 text-sm font-bold">✕</span>`;
            } else {
                btn.classList.add('opacity-60');
            }
        });

        // Show Explanation
        explanationBox.classList.remove('hidden');
        if (isCorrect) {
            explanationBox.className = 'mb-6 p-4 sm:p-5 rounded-xl border bg-emerald-950/30 border-emerald-500/40 text-emerald-200';
            explanationIcon.textContent = '🎉';
            explanationTitle.textContent = 'Верно! Отличное знание темы';
            explanationTitle.className = 'text-xs font-bold uppercase tracking-wider mb-1 text-emerald-400';
        } else {
            explanationBox.className = 'mb-6 p-4 sm:p-5 rounded-xl border bg-rose-950/30 border-rose-500/40 text-rose-200';
            explanationIcon.textContent = '💡';
            explanationTitle.textContent = 'Обрати внимание на ошибку';
            explanationTitle.className = 'text-xs font-bold uppercase tracking-wider mb-1 text-rose-400';
        }
        explanationText.textContent = q.explanation || 'Правильный вариант определен ключевыми положениями конспекта.';

        // Configure and trigger Deep AI Explanation
        if (aiExplanationContainer) {
            aiExplanationContainer.classList.remove('hidden');
            if (aiExplanationLoading) aiExplanationLoading.classList.remove('hidden');
            if (aiExplanationContent) {
                aiExplanationContent.classList.add('hidden');
                aiExplanationContent.innerHTML = '';
            }
            if (aiExplanationStatus) {
                aiExplanationStatus.textContent = isCorrect 
                    ? 'Анализ методических нюансов...' 
                    : 'Разбор причины ошибки и подготовка подсказки...';
            }

            const payload = {
                question_text: q.text,
                selected_option: q.options[selectedIndex] || '',
                correct_option: q.options[q.correct_index] || '',
                is_correct: isCorrect,
                source_text: (currentQuiz && currentQuiz.source_text) ? currentQuiz.source_text : notesTextarea.value.trim()
            };

            const thisAnswerRecord = answeredQuestions[answeredQuestions.length - 1];

            fetch('/api/explain_answer/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.explanation) {
                    if (aiExplanationLoading) aiExplanationLoading.classList.add('hidden');
                    if (aiExplanationContent) {
                        aiExplanationContent.innerHTML = formatAiExplanation(data.explanation);
                        aiExplanationContent.classList.remove('hidden');
                    }
                    if (aiExplanationStatus) {
                        aiExplanationStatus.textContent = 'Готово';
                    }
                    if (thisAnswerRecord) {
                        thisAnswerRecord.aiExplanation = data.explanation;
                    }
                } else {
                    if (aiExplanationLoading) aiExplanationLoading.classList.add('hidden');
                }
            })
            .catch(err => {
                console.warn('AI explanation request failed:', err);
                if (aiExplanationLoading) aiExplanationLoading.classList.add('hidden');
            });
        }

        // Configure Next Button
        btnNextQuestion.classList.remove('hidden');
        if (currentIndex + 1 < total) {
            btnNextText.textContent = 'Следующий вопрос';
        } else {
            btnNextText.textContent = '🎉 Узнать свой итоговый балл';
        }

        // Scroll smoothly to explanation
        explanationBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    btnNextQuestion.addEventListener('click', () => {
        const total = currentQuiz.questions.length;
        if (currentIndex + 1 < total) {
            currentIndex++;
            renderCurrentQuestion();
            quizPlayerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            showResults();
        }
    });

    btnBackToInput.addEventListener('click', () => {
        if (confirm('Хотите вернуться к вводу конспекта? Текущий прогресс будет сохранен в истории.')) {
            showInputSection();
        }
    });

    // -------------------------------------------------------------------------
    // 7. Results Screen & Review
    // -------------------------------------------------------------------------
    function showResults() {
        quizPlayerSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        const total = currentQuiz.questions.length;
        const percent = Math.round((score / total) * 100);

        statCorrect.textContent = `${score}`;
        statPercent.textContent = `${percent}%`;
        statTotal.textContent = `${total}`;

        if (score === 5) {
            resultEmoji.textContent = '🏆';
            resultHeadline.textContent = '5 из 5 — Идеально!';
            resultSubtext.textContent = 'Блестящий результат! Ты полностью готов к контрольной или экзамену по этой теме.';
        } else if (score >= 4) {
            resultEmoji.textContent = '🎉';
            resultHeadline.textContent = `${score} из ${total} — Отличный результат!`;
            resultSubtext.textContent = 'Отличная подготовка перед проверочной! Закрепи единственную ошибку в разборе ниже.';
        } else if (score >= 3) {
            resultEmoji.textContent = '👍';
            resultHeadline.textContent = `${score} из ${total} — Хорошая база!`;
            resultSubtext.textContent = 'Основы усвоены, но есть спорные моменты. Изучи подробный разбор, чтобы закрыть пробелы.';
        } else {
            resultEmoji.textContent = '💪';
            resultHeadline.textContent = `${score} из ${total} — Попробуй еще раз!`;
            resultSubtext.textContent = 'Материал пока усвоен не до конца. Внимательно перечитай конспект и пройди тест снова!';
        }

        // Prepare full review cards
        renderFullReview();

        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderFullReview() {
        reviewCardsList.innerHTML = '';
        const letters = ['A', 'B', 'C', 'D'];
        const MAX_RENDER = 50;
        const itemsToRender = answeredQuestions.slice(0, MAX_RENDER);

        itemsToRender.forEach((ans, idx) => {
            const card = document.createElement('div');
            card.className = `p-4 sm:p-5 rounded-xl border ${ans.isCorrect ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'} space-y-3`;

            let optionsHtml = '';
            ans.options.forEach((opt, oIdx) => {
                let badgeClass = 'bg-slate-800 text-slate-300';
                let itemClass = 'bg-slate-900/60 border-slate-800 text-slate-300';
                let icon = '';

                if (oIdx === ans.correctIndex) {
                    badgeClass = 'bg-emerald-500 text-slate-950 font-bold';
                    itemClass = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-medium';
                    icon = '<span class="text-emerald-400 font-bold ml-2">✓ (Правильный ответ)</span>';
                } else if (oIdx === ans.selectedIndex && !ans.isCorrect) {
                    badgeClass = 'bg-rose-500 text-white font-bold';
                    itemClass = 'bg-rose-950/40 border-rose-500/60 text-rose-200 line-through';
                    icon = '<span class="text-rose-400 font-bold ml-2">✕ (Твой ответ)</span>';
                }

                optionsHtml += `
                    <div class="p-2.5 rounded-lg border text-xs sm:text-sm flex items-center justify-between ${itemClass}">
                        <div class="flex items-center space-x-2">
                            <span class="w-5 h-5 rounded flex items-center justify-center text-xs ${badgeClass}">${letters[oIdx]}</span>
                            <span>${escapeHtml(opt)}</span>
                        </div>
                        <div>${icon}</div>
                    </div>
                `;
            });

            card.innerHTML = `
                <div class="flex items-start justify-between">
                    <span class="text-xs font-bold ${ans.isCorrect ? 'text-emerald-400' : 'text-rose-400'} uppercase">
                        Вопрос ${idx + 1} • ${ans.isCorrect ? 'Правильно' : 'Ошибка'}
                    </span>
                </div>
                <p class="text-sm font-semibold text-white whitespace-pre-line">${escapeHtml(ans.questionText)}</p>
                <div class="space-y-1.5">${optionsHtml}</div>
                <div class="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                    <strong class="text-indigo-400">💡 Краткий факт:</strong> ${escapeHtml(ans.explanation)}
                </div>
                ${ans.aiExplanation ? `
                <div class="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-500/30 text-xs text-slate-200">
                    <div class="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                        <span>🤖 Полный разбор от Gemini:</span>
                    </div>
                    <div>${formatAiExplanation(ans.aiExplanation)}</div>
                </div>` : ''}
            `;

            reviewCardsList.appendChild(card);
        });

        if (answeredQuestions.length > MAX_RENDER) {
            const note = document.createElement('div');
            note.className = 'p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400';
            note.textContent = `Показаны первые 50 вопросов из ${answeredQuestions.length} для максимальной скорости работы браузера.`;
            reviewCardsList.appendChild(note);
        }
    }

    btnToggleReview.addEventListener('click', () => {
        fullReviewContainer.classList.toggle('hidden');
        if (!fullReviewContainer.classList.contains('hidden')) {
            btnToggleReview.querySelector('span:last-child').textContent = 'Скрыть разбор ответов';
            fullReviewContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            btnToggleReview.querySelector('span:last-child').textContent = 'Разбор всех ответов';
        }
    });

    btnRetakeQuiz.addEventListener('click', () => {
        if (currentQuiz) {
            startQuiz(currentQuiz);
        }
    });

    btnNewQuizFromResult.addEventListener('click', () => {
        showInputSection();
    });

    function showInputSection() {
        quizPlayerSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        inputSection.classList.remove('hidden');
        inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        notesTextarea.focus();
    }

    // -------------------------------------------------------------------------
    // 8. Sidebar History & Loading Past Quizzes
    // -------------------------------------------------------------------------
    function addQuizToHistorySidebar(quiz) {
        const emptyMsg = document.getElementById('empty-history-msg');
        if (emptyMsg) {
            emptyMsg.remove();
        }

        const div = document.createElement('div');
        div.className = 'history-item p-3 rounded-xl bg-slate-950/60 hover:bg-indigo-950/50 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all duration-200 group animate-pulse-slow';
        div.dataset.quizId = quiz.id;

        const count = quiz.questions ? quiz.questions.length : (quiz.questions_count || 5);
        const dateStr = quiz.created_at || 'только что';

        div.innerHTML = `
            <div class="flex items-start justify-between gap-2">
                <h3 class="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 line-clamp-1">
                    ${escapeHtml(quiz.title)}
                </h3>
                <span class="text-[10px] text-slate-500 shrink-0">${escapeHtml(dateStr)}</span>
            </div>
            <div class="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                <span>${count} вопросов</span>
                <span class="text-indigo-400 group-hover:translate-x-0.5 transition-transform">Пройти ➔</span>
            </div>
        `;

        div.addEventListener('click', () => loadPastQuiz(quiz.id));

        // Insert at top of list
        historyList.insertBefore(div, historyList.firstChild);

        // Update count badge
        const currentCount = parseInt(historyCountBadge.textContent || '0', 10) + 1;
        historyCountBadge.textContent = currentCount;
    }

    // Attach click listeners to server-rendered history items
    document.querySelectorAll('.history-item').forEach(item => {
        const quizId = item.dataset.quizId;
        if (quizId) {
            item.addEventListener('click', () => loadPastQuiz(quizId));
        }
    });

    async function loadPastQuiz(quizId) {
        try {
            const resp = await fetch(`/api/quiz/${quizId}/`);
            if (!resp.ok) {
                throw new Error('Не удалось загрузить тест.');
            }
            const data = await resp.json();
            if (data.quiz) {
                startQuiz(data.quiz);
            }
        } catch (e) {
            console.error('Error loading past quiz:', e);
            alert('Ошибка при загрузке теста из истории.');
        }
    }

    // -------------------------------------------------------------------------
    // 9. Utility Helpers
    // -------------------------------------------------------------------------
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    // Initial character count
    updateCharCount();
});

