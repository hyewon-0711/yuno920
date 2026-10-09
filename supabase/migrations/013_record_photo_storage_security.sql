-- Keep record photos private and bind Storage access to the record's child.
INSERT INTO storage.buckets (id, name, public)
VALUES ('record-photos', 'record-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "record_photos_upload" ON storage.objects;
DROP POLICY IF EXISTS "record_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "record_photos_update" ON storage.objects;
DROP POLICY IF EXISTS "record_photos_delete" ON storage.objects;

-- Object path: {child_id}/{record_id}/{random-file-name}
CREATE POLICY "record_photos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'record-photos'
    AND EXISTS (
      SELECT 1
      FROM public.records r
      WHERE r.id::text = split_part(name, '/', 2)
        AND r.child_id::text = split_part(name, '/', 1)
        AND public.has_child_write_access(r.child_id)
    )
  );

CREATE POLICY "record_photos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'record-photos'
    AND (
      EXISTS (
        SELECT 1
        FROM public.records r
        WHERE r.id::text = split_part(name, '/', 2)
          AND r.child_id::text = split_part(name, '/', 1)
          AND public.has_child_access(r.child_id)
      )
      OR EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id::text = split_part(name, '/', 1)
          AND public.has_child_access(c.id)
      )
    )
  );

CREATE POLICY "record_photos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'record-photos'
    AND (
      EXISTS (
        SELECT 1
        FROM public.records r
        WHERE r.id::text = split_part(name, '/', 2)
          AND r.child_id::text = split_part(name, '/', 1)
          AND public.has_child_write_access(r.child_id)
      )
      OR EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id::text = split_part(name, '/', 1)
          AND public.has_child_write_access(c.id)
      )
    )
  )
  WITH CHECK (
    bucket_id = 'record-photos'
    AND EXISTS (
      SELECT 1
      FROM public.records r
      WHERE r.id::text = split_part(name, '/', 2)
        AND r.child_id::text = split_part(name, '/', 1)
        AND public.has_child_write_access(r.child_id)
    )
  );

CREATE POLICY "record_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'record-photos'
    AND (
      EXISTS (
        SELECT 1
        FROM public.records r
        WHERE r.id::text = split_part(name, '/', 2)
          AND r.child_id::text = split_part(name, '/', 1)
          AND public.has_child_write_access(r.child_id)
      )
      OR EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id::text = split_part(name, '/', 1)
          AND public.has_child_write_access(c.id)
      )
    )
  );
