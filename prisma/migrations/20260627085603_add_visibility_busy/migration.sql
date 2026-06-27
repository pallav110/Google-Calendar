-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "busy" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'default';
