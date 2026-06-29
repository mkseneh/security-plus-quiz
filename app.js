let questions = [];
let activeQuestions = [];
let currentIndex = Number(localStorage.getItem("securityPlusQuestionIndex")) || 0;

let answered = false;
let selectedLetter = null;
let selectedOption = null;
let reviewMode = false;
let currentDomainFilter = localStorage.getItem("securityPlusDomainFilter") || "all";

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

const domainFilterEl = document.createElement("div");
domainFilterEl.id = "domainFilter";

if (progressEl) {
  progressEl.insertAdjacentElement("beforebegin", domainFilterEl);
}

const gotoBarEl = document.createElement("div");
gotoBarEl.id = "gotoBar";

const gotoLabelEl = document.createElement("span");
gotoLabelEl.className = "goto-label";
gotoLabelEl.textContent = "Go to:";

const gotoDomainSelectEl = document.createElement("select");
gotoDomainSelectEl.className = "goto-domain-select";
gotoDomainSelectEl.id = "gotoDomainSelect";

const gotoQuestionInputEl = document.createElement("input");
gotoQuestionInputEl.className = "goto-question-input";
gotoQuestionInputEl.id = "gotoQuestionInput";
gotoQuestionInputEl.type = "number";
gotoQuestionInputEl.min = "1";
gotoQuestionInputEl.placeholder = "Question no.";

const gotoButtonEl = document.createElement("button");
gotoButtonEl.id = "gotoButton";
gotoButtonEl.className = "goto-button";
gotoButtonEl.type = "button";
gotoButtonEl.id = "gotoQuestionBtn";
gotoButtonEl.textContent = "Go";

const gotoMessageEl = document.createElement("span");
gotoMessageEl.id = "gotoMessage";
gotoMessageEl.className = "goto-message";

gotoBarEl.appendChild(gotoLabelEl);
gotoBarEl.appendChild(gotoDomainSelectEl);
gotoBarEl.appendChild(gotoQuestionInputEl);
gotoBarEl.appendChild(gotoButtonEl);
gotoBarEl.appendChild(gotoMessageEl);

if (domainFilterEl) {
  domainFilterEl.insertAdjacentElement("afterend", gotoBarEl);
}

gotoButtonEl.addEventListener("click", goToRequestedQuestion);
gotoQuestionInputEl.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    goToRequestedQuestion();
  }
});

const questionImageEl = document.createElement("div");
questionImageEl.id = "questionImage";

if (questionEl) {
  questionEl.insertAdjacentElement("afterend", questionImageEl);
}

fetch("questions.json?v=" + Date.now())
  .then(response => response.json())
  .then(data => {
    questions = data;

    buildDomainButtons();
    buildGotoControls();
    applyCurrentDomainFilter(false);

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

function getDomainNumber(q) {
  const domainText = q.domain || "";
  const match = domainText.match(/Domain\s+(\d+)/i);

  if (!match) {
    return null;
  }

  return match[1];
}

function getAvailableDomains() {
  const domains = new Set();

  questions.forEach(q => {
    const domainNumber = getDomainNumber(q);

    if (domainNumber) {
      domains.add(domainNumber);
    }
  });

  return Array.from(domains).sort((a, b) => Number(a) - Number(b));
}

function buildDomainButtons() {
  domainFilterEl.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.textContent = "All";
  allButton.className = currentDomainFilter === "all" ? "domain-filter-btn active-domain" : "domain-filter-btn";

  allButton.addEventListener("click", () => {
    reviewMode = false;
    currentDomainFilter = "all";
    localStorage.setItem("securityPlusDomainFilter", currentDomainFilter);
    currentIndex = Number(localStorage.getItem("securityPlusQuestionIndex")) || 0;
    applyCurrentDomainFilter(true);
    buildDomainButtons();
    buildGotoControls();
    showQuestion();
  });

  domainFilterEl.appendChild(allButton);

  const domains = getAvailableDomains();

  domains.forEach(domainNumber => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Domain " + domainNumber;
    button.className = currentDomainFilter === domainNumber ? "domain-filter-btn active-domain" : "domain-filter-btn";

    button.addEventListener("click", () => {
      reviewMode = false;
      currentDomainFilter = domainNumber;
      localStorage.setItem("securityPlusDomainFilter", currentDomainFilter);
      currentIndex = 0;
      applyCurrentDomainFilter(true);
      buildDomainButtons();
      showQuestion();
    });

    domainFilterEl.appendChild(button);
  });
}

function buildGotoControls() {
  if (!gotoDomainSelectEl) return;

  gotoDomainSelectEl.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All domains";
  gotoDomainSelectEl.appendChild(allOption);

  getAvailableDomains().forEach(domainNumber => {
    const option = document.createElement("option");
    option.value = domainNumber;
    option.textContent = "Domain " + domainNumber;
    gotoDomainSelectEl.appendChild(option);
  });

  gotoDomainSelectEl.value = currentDomainFilter === "mistakes" ? "all" : currentDomainFilter;
}

function goToRequestedQuestion() {
  const selectedDomain = gotoDomainSelectEl.value || "all";
  const requestedNumber = Number(gotoQuestionInputEl.value);

  gotoMessageEl.textContent = "";

  if (!Number.isInteger(requestedNumber) || requestedNumber < 1) {
    gotoMessageEl.textContent = "Enter a valid question number.";
    return;
  }

  reviewMode = false;
  currentDomainFilter = selectedDomain;
  localStorage.setItem("securityPlusDomainFilter", currentDomainFilter);

  applyCurrentDomainFilter(true);

  if (requestedNumber > activeQuestions.length) {
    gotoMessageEl.textContent = "Only " + activeQuestions.length + " question(s) in this selection.";
    return;
  }

  currentIndex = requestedNumber - 1;

  if (currentDomainFilter === "all") {
    localStorage.setItem("securityPlusQuestionIndex", currentIndex);
  }

  buildDomainButtons();
  buildGotoControls();
  showQuestion();

  gotoMessageEl.textContent = currentDomainFilter === "all"
    ? "Showing question " + requestedNumber + "."
    : "Showing Domain " + currentDomainFilter + ", question " + requestedNumber + ".";
}

function applyCurrentDomainFilter(resetIfNeeded) {
  if (currentDomainFilter === "all") {
    activeQuestions = questions;
  } else {
    activeQuestions = questions.filter(q => getDomainNumber(q) === currentDomainFilter);
  }

  if (resetIfNeeded || currentIndex >= activeQuestions.length) {
    currentIndex = 0;
  }

  if (!reviewMode && currentDomainFilter === "all") {
    localStorage.setItem("securityPlusQuestionIndex", currentIndex);
  }
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

  if (!reviewMode && currentDomainFilter !== "all" && activeQuestions.length === 0) {
    questionEl.textContent = "No questions found for Domain " + currentDomainFilter + ".";
    domainEl.textContent = "";
    progressEl.textContent = "Domain " + currentDomainFilter;

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

  if (reviewMode) {
    progressEl.textContent = "Review Mistakes: Question " + (currentIndex + 1) + " of " + activeQuestions.length;
  } else if (currentDomainFilter === "all") {
    progressEl.textContent = "Question " + (currentIndex + 1) + " of " + activeQuestions.length;
  } else {
    progressEl.textContent = "Domain " + currentDomainFilter + ": Question " + (currentIndex + 1) + " of " + activeQuestions.length;
  }

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

    if (!reviewMode && currentDomainFilter === "all") {
      localStorage.setItem("securityPlusQuestionIndex", currentIndex);
    }

    showQuestion();
  });
}

if (skipBtn) {
  skipBtn.addEventListener("click", () => {
    currentIndex++;

    if (!reviewMode && currentDomainFilter === "all") {
      localStorage.setItem("securityPlusQuestionIndex", currentIndex);
    }

    showQuestion();
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    reviewMode = false;
    currentDomainFilter = "all";
    localStorage.setItem("securityPlusDomainFilter", currentDomainFilter);
    activeQuestions = questions;
    currentIndex = 0;
    localStorage.setItem("securityPlusQuestionIndex", currentIndex);
    buildDomainButtons();
    buildGotoControls();
    showQuestion();
  });
}

if (allBtn) {
  allBtn.addEventListener("click", () => {
    reviewMode = false;
    currentDomainFilter = "all";
    localStorage.setItem("securityPlusDomainFilter", currentDomainFilter);
    activeQuestions = questions;
    currentIndex = Number(localStorage.getItem("securityPlusQuestionIndex")) || 0;

    if (currentIndex >= activeQuestions.length) {
      currentIndex = 0;
    }

    buildDomainButtons();
    buildGotoControls();
    showQuestion();
  });
}

if (mistakesBtn) {
  mistakesBtn.addEventListener("click", () => {
    reviewMode = true;
    currentDomainFilter = "mistakes";
    const mistakeIds = getMistakeIds();
    activeQuestions = questions.filter(q => mistakeIds.includes(String(q.id)));
    currentIndex = 0;
    buildDomainButtons();
    buildGotoControls();
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

    if (!reviewMode && currentDomainFilter === "all") {
      localStorage.setItem("securityPlusQuestionIndex", currentIndex);
    }

    showQuestion();
  });
}

function professionaliseButtonLayout() {
  if (document.body.dataset.buttonLayoutReady === "true") return;

  const allButtons = Array.from(document.querySelectorAll("button"));

  function findButton(text) {
    return allButtons.find(btn => btn.textContent.trim().toLowerCase() === text.toLowerCase());
  }

  const allQuestionsBtn = findButton("All Questions");
  const reviewMistakesBtn = allButtons.find(btn => btn.textContent.trim().toLowerCase().startsWith("review mistakes"));
  const resetProgressBtn = findButton("Reset Progress");
  const clearMistakesBtn = findButton("Clear Mistakes");

  const gotoBar = document.getElementById("gotoBar");

  if (gotoBar && (allQuestionsBtn || reviewMistakesBtn || resetProgressBtn || clearMistakesBtn)) {
    const toolbar = document.createElement("div");
    toolbar.id = "quizToolbar";

    const leftGroup = document.createElement("div");
    leftGroup.className = "quiz-toolbar-group";

    const rightGroup = document.createElement("div");
    rightGroup.className = "quiz-toolbar-group quiz-toolbar-danger-group";

    if (allQuestionsBtn) leftGroup.appendChild(allQuestionsBtn);
    if (reviewMistakesBtn) leftGroup.appendChild(reviewMistakesBtn);
    if (resetProgressBtn) rightGroup.appendChild(resetProgressBtn);
    if (clearMistakesBtn) rightGroup.appendChild(clearMistakesBtn);

    toolbar.appendChild(leftGroup);
    toolbar.appendChild(rightGroup);

    gotoBar.insertAdjacentElement("afterend", toolbar);
  }

  const checkAnswerBtn = findButton("Check Answer");
  const previousBtn = findButton("Previous Question");
  const skipBtn = findButton("Skip Question");
  const nextBtn = findButton("Next Question");

  if (checkAnswerBtn && (previousBtn || skipBtn || nextBtn)) {
    const actionBar = document.createElement("div");
    actionBar.id = "questionActionBar";

    const primaryGroup = document.createElement("div");
    primaryGroup.className = "question-action-primary";

    const navGroup = document.createElement("div");
    navGroup.className = "question-action-nav";

    primaryGroup.appendChild(checkAnswerBtn);
    if (previousBtn) navGroup.appendChild(previousBtn);
    if (skipBtn) navGroup.appendChild(skipBtn);
    if (nextBtn) navGroup.appendChild(nextBtn);

    actionBar.appendChild(primaryGroup);
    actionBar.appendChild(navGroup);

    const questionCard = checkAnswerBtn.closest(".card") || checkAnswerBtn.parentElement;
    questionCard.appendChild(actionBar);
  }

  document.body.dataset.buttonLayoutReady = "true";
}

setTimeout(professionaliseButtonLayout, 50);
window.addEventListener("load", professionaliseButtonLayout);
