let questions = [];
let activeQuestions = [];
let currentIndex = Number(localStorage.getItem("securityPlusQuestionIndex")) || 0;
let answered = false;
let reviewMode = false;

const progressEl = document.getElementById("progress");
const domainEl = document.getElementById("domain");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const explanationEl = document.getElementById("explanation");
const nextBtn = document.getElementById("nextBtn"); const skipBtn = document.getElementById("skipBtn");
const resetBtn = document.getElementById("resetBtn");
const allBtn = document.getElementById("allBtn");
const mistakesBtn = document.getElementById("mistakesBtn");
const clearMistakesBtn = document.getElementById("clearMistakesBtn");
const mistakeCountEl = document.getElementById("mistakeCount");

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
  const ids = getMistakeIds().filter(existingId => existingId !== idText);
  saveMistakeIds(ids);
}

function updateMistakeCount() {
  mistakeCountEl.textContent = getMistakeIds().length;
}

function hideFeedbackAreas() {
  feedbackEl.textContent = "";
  explanationEl.textContent = "";
  feedbackEl.style.display = "none";
  explanationEl.style.display = "none";
}

function setAllMode() {
  reviewMode = false;
  activeQuestions = questions;
  currentIndex = Number(localStorage.getItem("securityPlusQuestionIndex")) || 0;

  if (currentIndex >= activeQuestions.length) {
    currentIndex = 0;
  }

  showQuestion();
}

function setMistakeMode() {
  reviewMode = true;
  const mistakeIds = getMistakeIds();
  activeQuestions = questions.filter(q => mistakeIds.includes(String(q.id)));
  currentIndex = 0;
  showQuestion();
}

function showQuestion() {
  answered = false; nextBtn.disabled = true; skipBtn.disabled = false; skipBtn.style.display = "inline-block";
  nextBtn.style.display = "inline-block";
  hideFeedbackAreas();
  optionsEl.innerHTML = "";

  if (questions.length === 0) {
    questionEl.textContent = "No questions found.";
    domainEl.textContent = "";
    progressEl.textContent = "No questions loaded";
    nextBtn.style.display = "none";
    return;
  }

  if (reviewMode && activeQuestions.length === 0) {
    questionEl.textContent = "You have no mistakes to review.";
    domainEl.textContent = "";
    progressEl.textContent = "Review Mistakes";
    nextBtn.style.display = "none";
    return;
  }

  if (currentIndex >= activeQuestions.length) {
    questionEl.textContent = reviewMode ? "You have reviewed all missed questions." : "You have completed all questions.";
    domainEl.textContent = "";
    progressEl.textContent = reviewMode
      ? "Completed mistake review"
      : "Completed " + activeQuestions.length + " questions";
    nextBtn.style.display = "none";
    return;
  }

  const q = activeQuestions[currentIndex];

  progressEl.textContent = reviewMode
    ? "Review Mistakes: Question " + (currentIndex + 1) + " of " + activeQuestions.length
    : "Question " + (currentIndex + 1) + " of " + activeQuestions.length;

  domainEl.textContent = q.domain;
  questionEl.textContent = q.question;

  for (const [letter, text] of Object.entries(q.options)) {
    const option = document.createElement("div");
    option.className = "option";
    option.textContent = letter + ". " + text;
    option.addEventListener("click", () => checkAnswer(option, letter, q.answer, q.explanation, q.id));
    optionsEl.appendChild(option);
  }
}

function applyAnswerStyle(element, isCorrect) {
  element.classList.add(isCorrect ? "correct" : "wrong");
  element.style.setProperty("background-color", isCorrect ? "#d4edda" : "#f8d7da", "important");
  element.style.setProperty("border-color", isCorrect ? "#28a745" : "#dc3545", "important");
  element.style.setProperty("color", isCorrect ? "#155724" : "#721c24", "important");
}

function checkAnswer(selectedOption, selected, correct, explanation, questionId) {
  if (answered) return;

  answered = true; nextBtn.disabled = false; skipBtn.disabled = false;

  const allOptions = document.querySelectorAll(".option");

  allOptions.forEach(option => {
    option.style.pointerEvents = "none";

    if (option.textContent.startsWith(correct + ".")) {
      applyAnswerStyle(option, true);
    }
  });

  feedbackEl.style.display = "block";
  explanationEl.style.display = "block";

  if (selected === correct) {
    feedbackEl.textContent = "Correct.";
    removeMistake(questionId);
  } else {
    applyAnswerStyle(selectedOption, false);
    feedbackEl.textContent = "Wrong. The correct answer is " + correct + ".";
    addMistake(questionId);
  }

  explanationEl.textContent = explanation;
}

nextBtn.addEventListener("click", () => {
  currentIndex++;

  if (!reviewMode) {
    localStorage.setItem("securityPlusQuestionIndex", currentIndex);
  }

  showQuestion();
});
resetBtn.addEventListener("click", () => {
  reviewMode = false;
  activeQuestions = questions;
  currentIndex = 0;
  localStorage.setItem("securityPlusQuestionIndex", currentIndex);
  showQuestion();
});

allBtn.addEventListener("click", () => {
  setAllMode();
});

mistakesBtn.addEventListener("click", () => {
  setMistakeMode();
});

clearMistakesBtn.addEventListener("click", () => {
  localStorage.setItem("securityPlusMistakeIds", JSON.stringify([]));
  updateMistakeCount();

  if (reviewMode) {
    setMistakeMode();
  }
});
skipBtn.addEventListener("click", () => {
  currentIndex++;
  if (!reviewMode) {
    localStorage.setItem("securityPlusQuestionIndex", currentIndex);
  }
  showQuestion();
});