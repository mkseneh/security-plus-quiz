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

fetch("questions.json?v=" + Date.now())
  .then(response => response.json())
  .then(data => {
    questions = data;

    if (currentIndex >= questions.length) {
      currentIndex = 0;
      localStorage.setItem("securityPlusQuestionIndex", currentIndex);
    }

    showQuestion();
  })
  .catch(error => {
    questionEl.textContent = "Could not load questions.";
    console.error(error);
  });

function hideFeedbackAreas() {
  feedbackEl.textContent = "";
  explanationEl.textContent = "";
  feedbackEl.style.display = "none";
  explanationEl.style.display = "none";
}

function showQuestion() {
  answered = false;
  nextBtn.disabled = true;
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

  if (currentIndex >= questions.length) {
    questionEl.textContent = "You have completed all questions.";
    domainEl.textContent = "";
    progressEl.textContent = "Completed " + questions.length + " questions";
    optionsEl.innerHTML = "";
    hideFeedbackAreas();
    nextBtn.style.display = "none";
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

function checkAnswer(selectedOption, selected, correct, explanation) {
  if (answered) return;

  answered = true;
  nextBtn.disabled = false;

  const allOptions = document.querySelectorAll(".option");

  allOptions.forEach(option => {
    option.style.pointerEvents = "none";

    if (option.textContent.startsWith(correct + ".")) {
      option.classList.add("correct");
      option.style.backgroundColor = "#d4edda";
      option.style.borderColor = "#28a745";
      option.style.color = "#155724";
    }
  });

  feedbackEl.style.display = "block";
  explanationEl.style.display = "block";

  if (selected === correct) {
    feedbackEl.textContent = "Correct.";
  } else {
    selectedOption.classList.add("wrong");
    selectedOption.style.backgroundColor = "#f8d7da";
    selectedOption.style.borderColor = "#dc3545";
    selectedOption.style.color = "#721c24";
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
