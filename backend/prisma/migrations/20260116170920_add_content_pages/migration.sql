-- CreateTable
CREATE TABLE "AboutUsPage" (
    "id" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL DEFAULT 'About ISKCON Burla',
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "mission" TEXT,
    "missionImage" TEXT,
    "vision" TEXT,
    "history" TEXT,
    "historyImages" TEXT[],
    "founderInfo" TEXT,
    "founderImage" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "AboutUsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactUsPage" (
    "id" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL DEFAULT 'Contact Us',
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "address" TEXT NOT NULL DEFAULT 'ISKCON Burla, Odisha',
    "phoneNumbers" TEXT[],
    "emails" TEXT[],
    "mapEmbedUrl" TEXT,
    "timings" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ContactUsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempleConstructionPage" (
    "id" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL DEFAULT 'New Temple Construction',
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "projectDescription" TEXT,
    "targetAmount" DECIMAL(12,2),
    "raisedAmount" DECIMAL(12,2),
    "progressImages" TEXT[],
    "phases" JSONB,
    "donationLink" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "TempleConstructionPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SevaOpportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "amount" DECIMAL(10,2),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "SevaOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NityaSevakPage" (
    "id" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL DEFAULT 'Become a Nitya Sevak',
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "description" TEXT,
    "benefits" JSONB,
    "membershipTiers" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "NityaSevakPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NityaSevakApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "selectedTier" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "panNumber" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NityaSevakApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SevaOpportunity_isActive_idx" ON "SevaOpportunity"("isActive");

-- CreateIndex
CREATE INDEX "SevaOpportunity_category_idx" ON "SevaOpportunity"("category");

-- CreateIndex
CREATE INDEX "SevaOpportunity_displayOrder_idx" ON "SevaOpportunity"("displayOrder");

-- CreateIndex
CREATE INDEX "NityaSevakApplication_status_idx" ON "NityaSevakApplication"("status");

-- CreateIndex
CREATE INDEX "NityaSevakApplication_createdAt_idx" ON "NityaSevakApplication"("createdAt");

-- CreateIndex
CREATE INDEX "NityaSevakApplication_email_idx" ON "NityaSevakApplication"("email");
