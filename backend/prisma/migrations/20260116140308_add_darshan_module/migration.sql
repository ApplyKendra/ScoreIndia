-- CreateTable
CREATE TABLE "DarshanSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "DarshanSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AartiSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AartiSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DarshanImage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "DarshanImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DarshanSetting_key_key" ON "DarshanSetting"("key");

-- CreateIndex
CREATE INDEX "AartiSchedule_isActive_idx" ON "AartiSchedule"("isActive");

-- CreateIndex
CREATE INDEX "AartiSchedule_displayOrder_idx" ON "AartiSchedule"("displayOrder");

-- CreateIndex
CREATE INDEX "DarshanImage_isActive_idx" ON "DarshanImage"("isActive");

-- CreateIndex
CREATE INDEX "DarshanImage_date_idx" ON "DarshanImage"("date");

-- CreateIndex
CREATE INDEX "DarshanImage_displayOrder_idx" ON "DarshanImage"("displayOrder");
