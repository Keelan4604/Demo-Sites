-- CreateTable
CREATE TABLE "Jurisdiction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'state',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jurisdiction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "office" TEXT NOT NULL,
    "party" TEXT,
    "jurisdictionId" TEXT NOT NULL,
    "shortSummary" TEXT NOT NULL,
    "longSummary" TEXT,
    "imageUrl" TEXT,
    "websiteUrl" TEXT,
    "electionDate" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateTopic" (
    "candidateId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "CandidateTopic_pkey" PRIMARY KEY ("candidateId","topicId")
);

-- CreateTable
CREATE TABLE "Stance" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BallotMeasure" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "measureCode" TEXT,
    "jurisdictionId" TEXT NOT NULL,
    "electionDate" TEXT,
    "category" TEXT,
    "shortSummary" TEXT NOT NULL,
    "longSummary" TEXT,
    "yesMeans" TEXT,
    "noMeans" TEXT,
    "proArguments" TEXT,
    "conArguments" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BallotMeasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasureTopic" (
    "measureId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "MeasureTopic_pkey" PRIMARY KEY ("measureId","topicId")
);

-- CreateTable
CREATE TABLE "Swipe" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "candidateId" TEXT,
    "measureId" TEXT,
    "choice" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Swipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jurisdiction_abbreviation_key" ON "Jurisdiction"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "Topic"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Swipe_sessionId_idx" ON "Swipe"("sessionId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateTopic" ADD CONSTRAINT "CandidateTopic_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateTopic" ADD CONSTRAINT "CandidateTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stance" ADD CONSTRAINT "Stance_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotMeasure" ADD CONSTRAINT "BallotMeasure_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasureTopic" ADD CONSTRAINT "MeasureTopic_measureId_fkey" FOREIGN KEY ("measureId") REFERENCES "BallotMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasureTopic" ADD CONSTRAINT "MeasureTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_measureId_fkey" FOREIGN KEY ("measureId") REFERENCES "BallotMeasure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
