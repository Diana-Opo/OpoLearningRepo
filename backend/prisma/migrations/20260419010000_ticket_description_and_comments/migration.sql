-- AlterTable: add description to tickets
ALTER TABLE "tickets" ADD COLUMN "description" TEXT;

-- CreateTable: ticket_comments
CREATE TABLE "ticket_comments" (
    "id"         SERIAL       NOT NULL,
    "ticketId"   INTEGER      NOT NULL,
    "authorName" TEXT         NOT NULL,
    "role"       TEXT         NOT NULL DEFAULT 'reply',
    "text"       TEXT         NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
