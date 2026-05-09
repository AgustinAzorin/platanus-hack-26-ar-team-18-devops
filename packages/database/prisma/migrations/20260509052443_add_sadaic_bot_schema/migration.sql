-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "ipi_number" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work" (
    "id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "iswc" TEXT,
    "genre" TEXT,
    "lyrics" TEXT,
    "duration_sec" INTEGER,
    "creation_date" DATE,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_contributor" (
    "id" UUID NOT NULL,
    "work_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "split_percentage" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "work_contributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recording" (
    "id" UUID NOT NULL,
    "work_id" UUID NOT NULL,
    "isrc" TEXT,
    "version_label" TEXT,
    "audio_url" TEXT,
    "daw_project_url" TEXT,
    "recorded_at" TIMESTAMP(3),

    CONSTRAINT "recording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" UUID NOT NULL,
    "work_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "file_name" TEXT,
    "file_size" TEXT,
    "file_url" TEXT NOT NULL,
    "description" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license" (
    "id" UUID NOT NULL,
    "work_id" UUID NOT NULL,
    "licensee_name" TEXT NOT NULL,
    "licensee_email" TEXT,
    "platform" TEXT,
    "authorized_from" DATE NOT NULL,
    "authorized_until" DATE,
    "terms" TEXT,

    CONSTRAINT "license_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract" (
    "id" UUID NOT NULL,
    "work_id" UUID NOT NULL,
    "party_name" TEXT NOT NULL,
    "contract_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "signed_at" DATE,
    "expires_at" DATE,

    CONSTRAINT "contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_release" (
    "id" UUID NOT NULL,
    "recording_id" UUID NOT NULL,
    "platform_name" TEXT NOT NULL,
    "url" TEXT,
    "released_at" DATE,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "platform_release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim" (
    "id" UUID NOT NULL,
    "work_id" UUID,
    "source" TEXT NOT NULL DEFAULT 'CISAC',
    "external_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cisac_work_title" TEXT,
    "performer" TEXT,
    "usage" TEXT,
    "venue" TEXT,
    "execution_date" DATE,
    "period" TEXT,
    "amount" DECIMAL(12,2),
    "reason" TEXT,
    "deadline" DATE,
    "confidence" DOUBLE PRECISION,
    "matched_at" TIMESTAMP(3),
    "match_signals" JSONB,
    "requested_evidence" JSONB,
    "cisac_raw_data" JSONB,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_message" (
    "id" UUID NOT NULL,
    "claim_id" UUID NOT NULL,
    "direction" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "from_address" TEXT,
    "to_address" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_log" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "artist_ipi_number_key" ON "artist"("ipi_number");

-- CreateIndex
CREATE UNIQUE INDEX "work_iswc_key" ON "work"("iswc");

-- CreateIndex
CREATE INDEX "idx_work_artist" ON "work"("artist_id");

-- CreateIndex
CREATE INDEX "idx_work_iswc" ON "work"("iswc");

-- CreateIndex
CREATE UNIQUE INDEX "work_contributor_work_id_artist_id_key" ON "work_contributor"("work_id", "artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "recording_isrc_key" ON "recording"("isrc");

-- CreateIndex
CREATE INDEX "idx_recording_work" ON "recording"("work_id");

-- CreateIndex
CREATE INDEX "idx_recording_isrc" ON "recording"("isrc");

-- CreateIndex
CREATE INDEX "idx_evidence_work" ON "evidence"("work_id");

-- CreateIndex
CREATE INDEX "idx_evidence_type" ON "evidence"("type");

-- CreateIndex
CREATE INDEX "idx_license_work" ON "license"("work_id");

-- CreateIndex
CREATE INDEX "idx_contract_work" ON "contract"("work_id");

-- CreateIndex
CREATE INDEX "idx_platform_rec" ON "platform_release"("recording_id");

-- CreateIndex
CREATE INDEX "idx_claim_work" ON "claim"("work_id");

-- CreateIndex
CREATE INDEX "idx_claim_status" ON "claim"("status");

-- CreateIndex
CREATE INDEX "idx_claim_external" ON "claim"("external_ref");

-- CreateIndex
CREATE INDEX "idx_msg_claim" ON "claim_message"("claim_id");

-- CreateIndex
CREATE INDEX "idx_msg_direction" ON "claim_message"("direction");

-- CreateIndex
CREATE INDEX "idx_bot_log_kind" ON "bot_log"("kind");

-- AddForeignKey
ALTER TABLE "work" ADD CONSTRAINT "work_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_contributor" ADD CONSTRAINT "work_contributor_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_contributor" ADD CONSTRAINT "work_contributor_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recording" ADD CONSTRAINT "recording_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license" ADD CONSTRAINT "license_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_release" ADD CONSTRAINT "platform_release_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recording"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim" ADD CONSTRAINT "claim_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_message" ADD CONSTRAINT "claim_message_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
