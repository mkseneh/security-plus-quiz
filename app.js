let questions = [];
let currentIndex = Number(localStorage.getItem("securityPlusQuestionIndex")) || 0;
let answered = false;

const progressEl = document.getElementById("progress");
const domainEl = document.getElementById("domain");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const explanationEl = document.getElementById("explanation");
const nextBtn = document.getElementById("nextBtn");
const resetBtn = document.getElementById("resetBtn");

fetch("questions.json?v=clean-20260617")
  .then(response => response.json())
  .then(data => {
    questions = data;
    showQuestion();
  })
  .catch(error => {
    questionEl.textContent = "Could not load questions.";
    console.error(error);
  });

function showQuestion() {
  answered = false;
  nextBtn.disabled = true;
  feedbackEl.textContent = "";
  explanationEl.textContent = "";
  optionsEl.innerHTML = "";

  if (questions.length === 0) {
    questionEl.textContent = "No questions found.";
    domainEl.textContent = "";
    progressEl.textContent = "No questions loaded";
    return;
  }

  if (currentIndex >= questions.length) {
    questionEl.textContent = "You have completed all questions.";
    domainEl.textContent = "";
    progressEl.textContent = "Completed " + questions.length + " questions";
    nextBtn.disabled = true;
    return;
  }

  const q = questions[currentIndex];

  progressEl.textContent = "Question " + (currentIndex + 1) + " of " + questions.length;
  domainEl.textContent = q.domain;
  questionEl.textContent = q.question;

  for (const [letter, text] of Object.entries(q.options)) {
    const option = document.createElement("div");
    option.className = "option";
    option.textContent = letter + ". " + text;
    option.addEventListener("click", () => checkAnswer(option, letter, q.answer, q.explanation));
    optionsEl.appendChild(option);
  }
}

function applyAnswerStyle(element, isCorrect) {
  element.classList.add(isCorrect ? "correct" : "wrong");
  element.style.setProperty("background-color", isCorrect ? "#d4edda" : "#f8d7da", "important");
  element.style.setProperty("border-color", isCorrect ? "#28a745" : "#dc3545", "important");
  element.style.setProperty("color", isCorrect ? "#155724" : "#721c24", "important");
}

function checkAnswer(selectedElement, selected, correct, explanation) {
  if (answered) return;

  answered = true;
  nextBtn.disabled = false;

  const optionElements = document.querySelectorAll(".option");

  optionElements.forEach(element => {
    element.style.pointerEvents = "none";

    if (element.textContent.startsWith(correct + ".")) {
      applyAnswerStyle(element, true);
    }
  });

  if (selected === correct) {
    feedbackEl.textContent = "Correct.";
  } else {
    applyAnswerStyle(selectedElement, false);
    feedbackEl.textContent = "Wrong. The correct answer is " + correct + ".";
  }

  explanationEl.textContent = explanation;
}

nextBtn.addEventListener("click", () => {
  currentIndex++;
  localStorage.setItem("securityPlusQuestionIndex", currentIndex);
  showQuestion();
});

resetBtn.addEventListener("click", () => {
  currentIndex = 0;
  localStorage.setItem("securityPlusQuestionIndex", currentIndex);
  showQuestion();
});

nextBtn.addEventListener("click", () => {
  currentIndex++;
  localStorage.setItem("securityPlusQuestionIndex", currentIndex);
  showQuestion();
});
