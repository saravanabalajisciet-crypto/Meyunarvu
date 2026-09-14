-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('article', 'thirukkural', 'letter', 'business_idea', 'linkedin_post');

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT,
    "excerpt" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'draft',
    "type" "PostType" NOT NULL DEFAULT 'article',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "altText" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirukkuralMeta" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "tamilCouplet" TEXT NOT NULL,
    "englishTranslation" TEXT NOT NULL,
    "tamilCommentary" TEXT,
    "englishCommentary" TEXT,
    "kuralNumber" INTEGER,

    CONSTRAINT "ThirukkuralMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LetterMeta" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "recipient" TEXT,
    "letterDate" TIMESTAMP(3),
    "responseStatus" TEXT,
    "letterContent" TEXT,

    CONSTRAINT "LetterMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedInMeta" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "linkedInUrl" TEXT NOT NULL,
    "originalDate" TIMESTAMP(3),

    CONSTRAINT "LinkedInMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessIdeaMeta" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "freeUseNotice" TEXT NOT NULL DEFAULT 'These ideas are free for anyone to take and build. No attribution or credit required.',

    CONSTRAINT "BusinessIdeaMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manuscript" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "passphraseHash" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Manuscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "manuscriptId" TEXT NOT NULL,
    "title" TEXT,
    "slug" TEXT NOT NULL,
    "content" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ThirukkuralMeta_postId_key" ON "ThirukkuralMeta"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "ThirukkuralMeta_kuralNumber_key" ON "ThirukkuralMeta"("kuralNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LetterMeta_postId_key" ON "LetterMeta"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInMeta_postId_key" ON "LinkedInMeta"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessIdeaMeta_postId_key" ON "BusinessIdeaMeta"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Manuscript_slug_key" ON "Manuscript"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_manuscriptId_slug_key" ON "Chapter"("manuscriptId", "slug");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirukkuralMeta" ADD CONSTRAINT "ThirukkuralMeta_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LetterMeta" ADD CONSTRAINT "LetterMeta_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInMeta" ADD CONSTRAINT "LinkedInMeta_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessIdeaMeta" ADD CONSTRAINT "BusinessIdeaMeta_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "Manuscript"("id") ON DELETE CASCADE ON UPDATE CASCADE;
