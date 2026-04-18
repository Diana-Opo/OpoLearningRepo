CREATE TABLE "platform_issue_comments" (
  "id"         SERIAL PRIMARY KEY,
  "issueId"    INTEGER NOT NULL REFERENCES "platform_issues"("id") ON DELETE CASCADE,
  "authorName" TEXT NOT NULL,
  "text"       TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
