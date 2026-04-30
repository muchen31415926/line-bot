create or replace function match_files (
  query_embedding vector(768),
  source_id text,
  result_limit int default 3
)
returns table (
  similarity float,
  file_name text,
  extension text,
  file_size bigint,
  download_url text
)
language sql
as $$
  select
    1 - (embedding <=> query_embedding) as similarity,
    file_name,
    extension,
    file_size,
    download_url
  from line_files
  where line_files.source_id = source_id
  order by embedding <=> query_embedding
  limit result_limit;
$$;