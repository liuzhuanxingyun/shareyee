-- CreateTable
CREATE TABLE "workout_log" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "exercises" TEXT NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_log" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workout_log_date_key" ON "workout_log"("date");

-- CreateIndex
CREATE INDEX "workout_log_date_idx" ON "workout_log"("date");

-- CreateIndex
CREATE UNIQUE INDEX "study_log_date_key" ON "study_log"("date");

-- CreateIndex
CREATE INDEX "study_log_date_idx" ON "study_log"("date");
