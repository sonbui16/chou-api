-- CreateTable
CREATE TABLE "visitor_sessions" (
    "id" UUID NOT NULL,
    "visitor_id" VARCHAR(64) NOT NULL,
    "session_id" VARCHAR(64) NOT NULL,
    "user_id" UUID,
    "first_path" VARCHAR(2048) NOT NULL,
    "current_path" VARCHAR(2048) NOT NULL,
    "referrer" VARCHAR(2048),
    "device" VARCHAR(100) NOT NULL,
    "page_views" INTEGER NOT NULL DEFAULT 1,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visitor_sessions_session_id_key" ON "visitor_sessions"("session_id");

-- CreateIndex
CREATE INDEX "visitor_sessions_visitor_id_idx" ON "visitor_sessions"("visitor_id");

-- CreateIndex
CREATE INDEX "visitor_sessions_user_id_idx" ON "visitor_sessions"("user_id");

-- CreateIndex
CREATE INDEX "visitor_sessions_last_seen_at_idx" ON "visitor_sessions"("last_seen_at");

-- CreateIndex
CREATE INDEX "visitor_sessions_started_at_idx" ON "visitor_sessions"("started_at");

-- AddForeignKey
ALTER TABLE "visitor_sessions"
ADD CONSTRAINT "visitor_sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
