create table public.line_files (
  id bigserial not null,
  message_id text not null,
  message_type text not null,
  source_type text not null,
  source_id text not null,
  file_name text not null,
  storage_path text not null,
  content_type text not null,
  file_size bigint not null,
  download_url text not null,
  embedding extensions.vector null,
  extension text null,
  constraint line_files_pkey primary key (id),
  constraint line_files_message_id_key unique (message_id),
  constraint line_files_message_type_check check (
    (
      message_type = any (
        array[
          'image'::text,
          'video'::text,
          'audio'::text,
          'file'::text
        ]
      )
    )
  ),
  constraint line_files_source_type_check check (
    (
      source_type = any (array['user'::text, 'group'::text, 'room'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_line_files_source on public.line_files using btree (source_type, source_id) TABLESPACE pg_default;