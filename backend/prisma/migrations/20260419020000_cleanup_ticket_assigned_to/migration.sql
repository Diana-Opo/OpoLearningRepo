-- Set assignedTo to NULL for any ticket where the value is 0, negative,
-- or references a user that no longer exists.
UPDATE "tickets"
SET "assignedTo" = NULL
WHERE "assignedTo" IS NOT NULL
  AND ("assignedTo" <= 0
    OR NOT EXISTS (
      SELECT 1 FROM "users" WHERE "users"."id" = "tickets"."assignedTo"
    ));
