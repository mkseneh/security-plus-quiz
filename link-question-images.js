const fs = require("fs");
const path = require("path");

const questionsFile = "questions.json";
const imagesFolder = "images";

const questions = JSON.parse(fs.readFileSync(questionsFile, "utf8"));

const imageFiles = fs.readdirSync(imagesFolder)
  .filter(file => /^domain\d+-question\d+\.(jpg|jpeg|png|webp)$/i.test(file));

let updated = 0;

for (const file of imageFiles) {
  const match = file.match(/^domain(\d+)-question(\d+)\.(jpg|jpeg|png|webp)$/i);

  const domainNumber = Number(match[1]);
  const questionNumber = Number(match[2]);

  const domainQuestions = questions
    .map((q, index) => ({ q, index }))
    .filter(({ q }) => {
      const text = [
        q.domain,
        q.domainName,
        q.category,
        q.section,
        q.objective,
        q.examDomain
      ].filter(Boolean).join(" ").toLowerCase();

      return text.includes("domain " + domainNumber) ||
             text.startsWith(String(domainNumber)) ||
             text.includes(domainNumber + ".");
    });

  if (domainQuestions.length < questionNumber) {
    console.log(`SKIPPED: ${file} - could not find Domain ${domainNumber} question ${questionNumber}`);
    continue;
  }

  const target = domainQuestions[questionNumber - 1];

  target.q.image = `images/${file}`;
  target.q.imageAlt = `Image for Domain ${domainNumber} question ${questionNumber}`;

  console.log(`UPDATED: Domain ${domainNumber} question ${questionNumber} -> images/${file}`);
  updated++;
}

fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2) + "\n");

console.log("");
console.log(`Finished. Images linked: ${updated}`);
