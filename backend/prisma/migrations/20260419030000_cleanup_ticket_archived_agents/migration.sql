-- Clear assignedTo for tickets where the referenced agent is archived or does not exist.
-- (Previous cleanup checked the wrong table; agents live in "agents", not "users".)
UPDATE "tickets"
SET "assignedTo" = NULL
WHERE "assignedTo" IS NOT NULL
  AND (
    NOT EXISTS (SELECT 1 FROM "agents" WHERE "agents"."id" = "tickets"."assignedTo")
    OR EXISTS  (SELECT 1 FROM "agents" WHERE "agents"."id" = "tickets"."assignedTo" AND "agents"."status" = 'archived')
  );
