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
  if (prevBtn) {
    prevBtn.disabled = currentIndex <= 0;
  }

  answered = false;

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
      checkAnswer(option, letter, q);
    });

    optionsEl.appendChild(option);
  }
}

function addParagraph(parent, text, className = "") {
  const p = document.createElement("p");

  if (className) {
    p.className = className;
  }

  p.style.whiteSpace = "pre-line";
  p.textContent = text || "";
  parent.appendChild(p);

  return p;
}

function addHeading(parent, text, level = 2) {
  const h = document.createElement("h" + level);
  h.textContent = text;
  parent.appendChild(h);
  return h;
}

function getCorrectText(q) {
  return q.answerText || (q.options && q.options[q.answer]) || "";
}

function getTeachingData(q) {
  return q.teachingExplanation || {};
}

function getQuestionAskingText(q) {
  const teaching = getTeachingData(q);

  if (teaching.whatQuestionIsAsking) {
    return teaching.whatQuestionIsAsking;
  }

  return "This question is asking you to match the scenario to the best Security+ concept. Focus on the wording in the question, then compare the options carefully.";
}

function getKeyCluePhrase(q) {
  const teaching = getTeachingData(q);

  if (teaching.keyCluePhrase) {
    return teaching.keyCluePhrase;
  }

  return q.question || "the exact wording of the question";
}

function getOptionExplanation(q, letter, text) {
  const teaching = getTeachingData(q);

  if (teaching.optionExplanations && teaching.optionExplanations[letter]) {
    return teaching.optionExplanations[letter];
  }

  return text + " is one of the possible choices. Check whether it matches the exact clue phrase in the question.";
}

function getCompareText(q) {
  const teaching = getTeachingData(q);

  if (teaching.compareOptionsAgainstClue) {
    return teaching.compareOptionsAgainstClue;
  }

  const clue = getKeyCluePhrase(q);
  return "Compare each option against the clue phrase: " + clue + ". The right answer is the one that directly matches that clue.";
}

function getFinalAnswerExplanation(q) {
  const teaching = getTeachingData(q);
  const correct = q.answer;
  const correctText = getCorrectText(q);

  if (teaching.finalAnswerExplanation) {
    return teaching.finalAnswerExplanation;
  }

  const correctExplanation = getOptionExplanation(q, correct, correctText);
  return "The correct answer is " + correct + ". " + correctText + ".\n\nThis is the answer because: " + correctExplanation;
}

function renderDetailedExplanation(q, selected) {
  explanationEl.innerHTML = "";

  const clue = getKeyCluePhrase(q);
  const teaching = getTeachingData(q);

  addHeading(explanationEl, "What the question is asking", 2);
  addParagraph(explanationEl, getQuestionAskingText(q));

  if (Array.isArray(teaching.questionBreakdown) && teaching.questionBreakdown.length > 0) {
    addHeading(explanationEl, "Breaking down the question", 2);
    teaching.questionBreakdown.forEach(item => addParagraph(explanationEl, item));
  }

  addHeading(explanationEl, "Key clue phrase", 2);
  addParagraph(explanationEl, clue, "key-clue-box");

  addHeading(explanationEl, "Answer options explained", 2);

  for (const [letter, text] of Object.entries(q.options || {})) {
    addHeading(explanationEl, "Option " + letter + ": " + text, 3);
    addParagraph(explanationEl, getOptionExplanation(q, letter, text), "option-explanation-text");
  }

  addHeading(explanationEl, "Compare the options against the clue", 2);
  addParagraph(explanationEl, getCompareText(q), "compare-box");

  addHeading(explanationEl, "Final answer", 2);

  if (selected === q.answer) {
    addParagraph(explanationEl, "You selected " + selected + ". That matches the correct answer.", "selected-result correct-text");
  } else {
    addParagraph(explanationEl, "You selected " + selected + ". The correct answer is different.", "selected-result wrong-text");
  }

  addParagraph(explanationEl, getFinalAnswerExplanation(q), "final-answer-box");
}

function checkAnswer(selectedOption, selected, q) {
  if (answered) return;

  answered = true;

  if (nextBtn) nextBtn.disabled = false;
  if (skipBtn) skipBtn.disabled = false;

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

  addParagraph(
    feedbackEl,
    "You selected " + selected + ". Click More to see the full explanation.",
    "result-line"
  );

  const moreBtn = document.createElement("button");
  moreBtn.type = "button";
  moreBtn.textContent = "More...";
  moreBtn.className = "moreBtn";
  feedbackEl.appendChild(moreBtn);

  moreBtn.addEventListener("click", () => {
    const isHidden = explanationEl.style.display === "none";

    if (isHidden && explanationEl.innerHTML.trim() === "") {
      renderDetailedExplanation(q, selected);
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
  allBtn.addEventListener("click", () => setAllMode());
}

if (mistakesBtn) {
  mistakesBtn.addEventListener("click", () => setMistakeMode());
}

if (clearMistakesBtn) {
  clearMistakesBtn.addEventListener("click", () => {
    localStorage.removeItem("securityPlusMistakeIds");
    updateMistakeCount();

    if (reviewMode) {
      setMistakeMode();
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
