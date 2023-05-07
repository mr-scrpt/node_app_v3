CREATE TABLE "Page" (
  "pageId" bigint generated always as identity,
  "name" varchar(20) NOT NULL,
  "slug" varchar NOT NULL
);

ALTER TABLE "Page" ADD CONSTRAINT "pkPage" PRIMARY KEY ("pageId");
CREATE UNIQUE INDEX "akPageName" ON "Page" ("name");
CREATE UNIQUE INDEX "akPageSlug" ON "Page" ("slug");
