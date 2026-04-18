-- Ensure Questions seed is idempotent by enforcing unique question text.
-- 1) Remove duplicate rows, keeping the lowest id per question.
DELETE q1
FROM Questions q1
INNER JOIN Questions q2
  ON q1.question = q2.question
 AND q1.id > q2.id;

-- 2) Add unique index for question text.
ALTER TABLE Questions
ADD UNIQUE INDEX Questions_question_key (question);
