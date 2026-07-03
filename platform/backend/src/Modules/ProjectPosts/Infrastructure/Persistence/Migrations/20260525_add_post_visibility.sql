-- Historical/manual migration reference.
-- ProjectPosts uses repository-driven raw Npgsql schema bootstrap in
-- PostgresProjectPostRepository.EnsureSchemaAsync; keep this file aligned
-- with that bootstrap logic when applying migrations manually.

alter table project_posts
    add column if not exists visibility text;

alter table project_posts
    add column if not exists published_at timestamptz null;

update project_posts
set visibility = 'public'
where kind = 'post'
  and (visibility is null or btrim(visibility) = '');

update project_posts
set visibility = 'public'
where kind = 'post'
  and visibility = 'demo';

alter table project_posts
    alter column visibility set default 'public';

alter table project_posts
    alter column visibility set not null;

create index if not exists ix_project_posts_public_posts_published_at
    on project_posts (published_at desc)
    where kind = 'post' and visibility = 'public';
