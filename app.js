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

function getCorrectText(q) {
  return q.answerText || (q.options && q.options[q.answer]) || "";
}

function getMoreText(q) {
  if (q.moreText) return q.moreText;
  if (q.more) return q.more;
  if (q.explanation) return q.explanation;

  if (q.teachingExplanation && q.teachingExplanation.finalAnswerExplanation) {
    return q.teachingExplanation.finalAnswerExplanation;
  }

  return "No More text has been added for this question yet.";
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
  if (checkBtn) checkBtn.disabled = false;
}

function renderPlainMore(q, selected) {
  explanationEl.innerHTML = "";

  const box = document.createElement("div");
  box.style.whiteSpace = "pre-wrap";
  box.style.lineHeight = "1.6";
  box.style.padding = "14px";
  box.style.border = "1px solid #d0d7de";
  box.style.borderRadius = "8px";
  box.style.background = "#ffffff";
  box.textContent = getMoreText(q);

  explanationEl.appendChild(box);
}

function checkAnswer(selectedOption, selected, q) {
  if (answered) return;

  answered = true;

  if (nextBtn) nextBtn.disabled = false;
  if (skipBtn) skipBtn.disabled = false;

  const checkBtn = document.getElementById("checkAnswerBtn");
  if (checkBtn) checkBtn.disabled = true;

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
  explanationEl.style.display = "none";
  feedbackEl.innerHTML = "";
  explanationEl.innerHTML = "";

  const result = document.createElement("p");
  result.className = selected === q.answer ? "correct-text" : "wrong-text";
  result.textContent = selected === q.answer
    ? "You selected " + selected + ". Correct."
    : "You selected " + selected + ". Correct answer: " + q.answer + ". " + getCorrectText(q);

  feedbackEl.appendChild(result);

  const moreBtn = document.createElement("button");
  moreBtn.type = "button";
  moreBtn.textContent = "More...";
  moreBtn.className = "moreBtn";
  feedbackEl.appendChild(moreBtn);

  moreBtn.addEventListener("click", () => {
    const isHidden = explanationEl.style.display === "none";

    if (isHidden && explanationEl.innerHTML.trim() === "") {
      renderPlainMore(q, selected);
    }

    explanationEl.style.display = isHidden ? "block" : "none";
    moreBtn.textContent = isHidden ? "Less..." : "More...";
  });
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
