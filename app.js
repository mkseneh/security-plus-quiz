let questions = [];
let activeQuestions = [];
let currentIndex = Number(localStorage.getItem("securityPlusQuestionIndex")) || 0;

let answered = false;
let selectedLetter = null;
let selectedOption = null;
let reviewMode = false;

const progressEl = document.getElementById("progress");
const domainEl = document.getElementById("domain");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const explanationEl = document.getElementById("explanation");

const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const skipBtn = document.getElementById("skipBtn");
const resetBtn = document.getElementById("resetBtn");
const allBtn = document.getElementById("allBtn");
const mistakesBtn = document.getElementById("mistakesBtn");
const clearMistakesBtn = document.getElementById("clearMistakesBtn");
const mistakeCountEl = document.getElementById("mistakeCount");

const questionImageEl = document.createElement("div");
questionImageEl.id = "questionImage";

if (questionEl) {
  questionEl.insertAdjacentElement("afterend", questionImageEl);
}

fetch("questions.json?v=" + Date.now())
  .then(response => response.json())
  .then(data => {
    questions = data;
    activeQuestions = questions;

    if (currentIndex >= activeQuestions.length) {
      currentIndex = 0;
      localStorage.setItem("securityPlusQuestionIndex", currentIndex);
    }

    updateMistakeCount();
    showQuestion();
  })
  .catch(error => {
    questionEl.textContent = "Could not load questions.";
    console.error(error);
  });

function getMistakeIds() {
  try {
    return JSON.parse(localStorage.getItem("securityPlusMistakeIds")) || [];
  } catch {
    return [];
  }
}

function saveMistakeIds(ids) {
  localStorage.setItem("securityPlusMistakeIds", JSON.stringify(ids));
  updateMistakeCount();
}

function addMistake(id) {
  const ids = getMistakeIds();
  const idText = String(id);

  if (!ids.includes(idText)) {
    ids.push(idText);
    saveMistakeIds(ids);
  }
}

function removeMistake(id) {
  const idText = String(id);
  saveMistakeIds(getMistakeIds().filter(existingId => existingId !== idText));
}

function updateMistakeCount() {
  if (mistakeCountEl) {
    mistakeCountEl.textContent = getMistakeIds().length;
  }
}

function hideFeedbackAreas() {
  feedbackEl.innerHTML = "";
  explanationEl.innerHTML = "";
  feedbackEl.style.display = "none";
  explanationEl.style.display = "none";
}

function hideQuestionImage() {
  questionImageEl.innerHTML = "";
  questionImageEl.style.display = "none";
}

function renderQuestionImage(q) {
  hideQuestionImage();

  if (!q.image) {
    return;
  }

  const img = document.createElement("img");
  img.src = q.image;
  img.alt = q.imageAlt || "Question image";
  img.className = "question-image";

  questionImageEl.appendChild(img);
  questionImageEl.style.display = "block";
}

function getCorrectText(q) {
  if (q.answerText) {
    return q.answerText;
  }

  if (q.options && q.options[q.answer]) {
    return q.options[q.answer];
  }

  return "";
}

function getExplanationText(q) {
  if (q.explanation) {
    return q.explanation;
  }

  if (q.teachingExplanation && q.teachingExplanation.finalAnswerExplanation) {
    return q.teachingExplanation.finalAnswerExplanation;
  }

  return "";
}

function showQuestion() {
  if (prevBtn) {
    prevBtn.disabled = currentIndex <= 0;
  }

  answered = false;
  selectedLetter = null;
  selectedOption = null;

  if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.style.display = "inline-block";
  }

  if (skipBtn) {
    skipBtn.disabled = false;
    skipBtn.style.display = "inline-block";
  }

  hideFeedbackAreas();
  hideQuestionImage();
  optionsEl.innerHTML = "";

  if (questions.length === 0) {
    questionEl.textContent = "No questions found.";
    domainEl.textContent = "";
    progressEl.textContent = "No questions loaded";

    if (nextBtn) nextBtn.style.display = "none";
    if (skipBtn) skipBtn.style.display = "none";

    return;
  }

  if (reviewMode && activeQuestions.length === 0) {
    questionEl.textContent = "You have no mistakes to review.";
    domainEl.textContent = "";
    progressEl.textContent = "Review Mistakes";

    if (nextBtn) nextBtn.style.display = "none";
    if (skipBtn) skipBtn.style.display = "none";

    return;
  }

  if (currentIndex >= activeQuestions.length) {
    questionEl.textContent = reviewMode
      ? "You have reviewed all missed questions."
      : "You have completed all questions.";

    domainEl.textContent = "";
    progressEl.textContent = reviewMode
      ? "Completed mistake review"
      : "Completed " + activeQuestions.length + " questions";

    if (nextBtn) nextBtn.style.display = "none";
    if (skipBtn) skipBtn.style.display = "none";

    return;
  }

  const q = activeQuestions[currentIndex];

  progressEl.textContent = reviewMode
    ? "Review Mistakes: Question " + (currentIndex + 1) + " of " + activeQuestions.length
    : "Question " + (currentIndex + 1) + " of " + activeQuestions.length;

  domainEl.textContent = q.domain || "";
  questionEl.textContent = q.question || "";

  renderQuestionImage(q);

  for (const [letter, text] of Object.entries(q.options || {})) {
    const option = document.createElement("div");
    option.className = "option";
    option.textContent = letter + ". " + text;

    option.addEventListener("click", () => {
      selectOption(option, letter);
    });

    optionsEl.appendChild(option);
  }

  const checkBtn = document.createElement("button");
  checkBtn.type = "button";
  checkBtn.id = "checkAnswerBtn";
  checkBtn.textContent = "Check Answer";
  checkBtn.className = "checkBtn";
  checkBtn.disabled = true;

  checkBtn.addEventListener("click", () => {
    if (!selectedOption || !selectedLetter) return;
    checkAnswer(selectedOption, selectedLetter, q);
  });

  optionsEl.appendChild(checkBtn);
}

function selectOption(option, letter) {
  if (answered) return;

  document.querySelectorAll(".option").forEach(item => {
    item.classList.remove("selected-option");
  });

  selectedOption = option;
  selectedLetter = letter;
  option.classList.add("selected-option");

  const checkBtn = document.getElementById("checkAnswerBtn");

  if (checkBtn) {
    checkBtn.disabled = false;
  }
}

function renderExplanation(q) {
  const explanationText = getExplanationText(q);

  explanationEl.innerHTML = "";

  if (!explanationText) {
    explanationEl.style.display = "none";
    return;
  }

  const box = document.createElement("div");
  box.className = "explanation-box";
  box.textContent = explanationText;

  explanationEl.appendChild(box);
  explanationEl.style.display = "block";
}

function checkAnswer(selectedOption, selected, q) {
  if (answered) return;

  answered = true;

  if (nextBtn) nextBtn.disabled = false;
  if (skipBtn) skipBtn.disabled = false;

  const checkBtn = document.getElementById("checkAnswerBtn");

  if (checkBtn) {
    checkBtn.disabled = true;
  }

  const allOptions = document.querySelectorAll(".option");

  allOptions.forEach(option => {
    option.style.pointerEvents = "none";
  });

  selectedOption.classList.add("selected-option");

  if (selected === q.answer) {
    removeMistake(q.id);
  } else {
    addMistake(q.id);
  }

  feedbackEl.style.display = "block";
  feedbackEl.innerHTML = "";

  const result = document.createElement("p");
  result.className = selected === q.answer ? "correct-text" : "wrong-text";

  result.textContent = selected === q.answer
    ? "You selected " + selected + ". Correct."
    : "You selected " + selected + ". Incorrect.";

  feedbackEl.appendChild(result);

  const correctAnswer = document.createElement("p");
  correctAnswer.className = "correct-answer-text";
  correctAnswer.textContent = "Correct answer: " + q.answer + ". " + getCorrectText(q);

  feedbackEl.appendChild(correctAnswer);

  renderExplanation(q);
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    currentIndex++;

    if (!reviewMode) {
      localStorage.setItem("securityPlusQuestionIndex", currentIndex);
    }

    showQuestion();
  });
}

if (skipBtn) {
  skipBtn.addEventListener("click", () => {
    currentIndex++;

    if (!reviewMode) {
      localStorage.setItem("securityPlusQuestionIndex", currentIndex);
    }

    showQuestion();
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    reviewMode = false;
    activeQuestions = questions;
    currentIndex = 0;
    localStorage.setItem("securityPlusQuestionIndex", currentIndex);
    showQuestion();
  });
}

if (allBtn) {
  allBtn.addEventListener("click", () => {
    reviewMode = false;
    activeQuestions = questions;
    currentIndex = Number(localStorage.getItem("securityPlusQuestionIndex")) || 0;

    if (currentIndex >= activeQuestions.length) {
      currentIndex = 0;
    }

    showQuestion();
  });
}

if (mistakesBtn) {
  mistakesBtn.addEventListener("click", () => {
    reviewMode = true;
    const mistakeIds = getMistakeIds();
    activeQuestions = questions.filter(q => mistakeIds.includes(String(q.id)));
    currentIndex = 0;
    showQuestion();
  });
}

if (clearMistakesBtn) {
  clearMistakesBtn.addEventListener("click", () => {
    localStorage.removeItem("securityPlusMistakeIds");
    updateMistakeCount();

    if (reviewMode) {
      const mistakeIds = getMistakeIds();
      activeQuestions = questions.filter(q => mistakeIds.includes(String(q.id)));
      currentIndex = 0;
      showQuestion();
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentIndex <= 0) return;

    currentIndex--;

    if (!reviewMode) {
      localStorage.setItem("securityPlusQuestionIndex", currentIndex);
    }

    showQuestion();
  });
}