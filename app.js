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

fetch("questions.json")
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
    progressEl.textContent = `Completed ${questions.length} questions`;
    nextBtn.disabled = true;
    return;
  }

  const q = questions[currentIndex];

  progressEl.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  domainEl.textContent = q.domain;
  questionEl.textContent = q.question;

  for (const [letter, text] of Object.entries(q.options)) {
    const button = document.createElement("div");
    button.className = "option";
    button.textContent = `${letter}. ${text}`;
    button.addEventListener("click", () => checkAnswer(button, letter, q.answer, q.explanation));
    optionsEl.appendChild(button);
  }
}

function checkAnswer(button, selected, correct, explanation) {
  if (answered) return;

  answered = true;
  nextBtn.disabled = false;

  const optionButtons = document.querySelectorAll(".option");

  optionButtons.forEach(btn => {
    btn.style.pointerEvents = "none";

    if (btn.textContent.startsWith(correct + ".")) {
      btn.classList.add("correct");
    }
  });

  if (selected === correct) {
    button.classList.add("correct");
    feedbackEl.textContent = "Correct.";
  } else {
    button.classList.add("wrong");
    feedbackEl.textContent = `Wrong. The correct answer is ${correct}.`;
  }

  explanationEl.textContent = explanation;
}

resetBtn.addEventListener("click", () => {
  currentIndex = 0;
  localStorage.setItem("securityPlusQuestionIndex", currentIndex);
  showQuestion();
});


// FINAL OVERRIDE: force answer colours using inline styles.
checkAnswer = function(button, selected, correct, explanation) {
  if (answered) return;

  answered = true;
  nextBtn.disabled = false;

  const optionButtons = document.querySelectorAll(".option");

  optionButtons.forEach(btn => {
    btn.disabled = false;
    btn.style.pointerEvents = "none";
    btn.style.backgroundColor = "#ffffff";
    btn.style.borderColor = "#cccccc";
    btn.style.color = "#222222";

    if (btn.textContent.startsWith(correct + ".")) {
      btn.classList.add("correct");
      btn.style.backgroundColor = "#d4edda";
      btn.style.borderColor = "#28a745";
      btn.style.color = "#155724";
    }
  });

  if (selected === correct) {
    feedbackEl.textContent = "Correct.";
  } else {
    button.classList.add("wrong");
    button.style.backgroundColor = "#f8d7da";
    button.style.borderColor = "#dc3545";
    button.style.color = "#721c24";
    feedbackEl.textContent = `Wrong. The correct answer is ${correct}.`;
  }

  explanationEl.textContent = explanation;
};

