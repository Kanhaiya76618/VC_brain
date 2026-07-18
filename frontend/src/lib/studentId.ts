const KEY = 'researchos-student-id';

/** Client-side only — returns a stable per-browser student id. */
export function getStudentId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
