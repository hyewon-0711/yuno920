import { supabase } from "@/lib/supabase";

export const RECORD_PHOTOS_BUCKET = "record-photos";
export const MAX_RECORD_PHOTO_SIZE = 10 * 1024 * 1024;

/** Accept both new Storage paths and legacy record photo URLs. */
export function getRecordPhotoPath(value: string): string | null {
  if (!value) return null;
  if (!value.startsWith("http")) return value;

  const publicMarker = `/storage/v1/object/public/${RECORD_PHOTOS_BUCKET}/`;
  const signedMarker = `/storage/v1/object/sign/${RECORD_PHOTOS_BUCKET}/`;
  const publicIndex = value.indexOf(publicMarker);
  const signedIndex = value.indexOf(signedMarker);
  const start = publicIndex >= 0
    ? publicIndex + publicMarker.length
    : signedIndex >= 0
      ? signedIndex + signedMarker.length
      : -1;

  if (start < 0) return null;
  return decodeURIComponent(value.slice(start).split("?")[0]);
}

export function getRecordPhotoPaths(values: string[]): string[] {
  return values
    .map(getRecordPhotoPath)
    .filter((path): path is string => Boolean(path));
}

export async function uploadRecordPhotos(
  childId: string,
  recordId: string,
  files: File[],
): Promise<string[]> {
  const paths: string[] = [];

  try {
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        throw new Error("이미지 파일만 업로드할 수 있습니다.");
      }
      if (file.size > MAX_RECORD_PHOTO_SIZE) {
        throw new Error("사진은 한 장당 10MB 이하만 업로드할 수 있습니다.");
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${childId}/${recordId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage
        .from(RECORD_PHOTOS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (error) throw error;
      paths.push(path);
    }
  } catch (error) {
    if (paths.length > 0) {
      await supabase.storage.from(RECORD_PHOTOS_BUCKET).remove(paths);
    }
    throw error;
  }

  return paths;
}

export async function getRecordPhotoUrls(values: string[]): Promise<string[]> {
  if (values.length === 0) return [];

  const paths = values.map(getRecordPhotoPath);
  const signedPaths = paths.filter((path): path is string => Boolean(path));
  const signedUrls = new Map<string, string>();

  if (signedPaths.length > 0) {
    const { data, error } = await supabase.storage
      .from(RECORD_PHOTOS_BUCKET)
      .createSignedUrls(signedPaths, 60 * 60);
    if (error) throw error;

    for (const item of data || []) {
      if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl);
    }
  }

  return values.map((value, index) => {
    const path = paths[index];
    return (path && signedUrls.get(path)) || value;
  });
}

export async function removeRecordPhotos(values: string[]): Promise<void> {
  const paths = getRecordPhotoPaths(values);
  if (paths.length === 0) return;

  const { error } = await supabase.storage
    .from(RECORD_PHOTOS_BUCKET)
    .remove(paths);
  if (error) throw error;
}
