-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL,
    "speed" TEXT NOT NULL,
    "isPro" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "capabilities" TEXT[],

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userPinnedModels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "models" TEXT[],

    CONSTRAINT "userPinnedModels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "userPinnedModels_userId_key" ON "userPinnedModels"("userId");

-- AddForeignKey
ALTER TABLE "userPinnedModels" ADD CONSTRAINT "userPinnedModels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
