// The SOW library: typical rate and hours per job profile. OWNER: Krishna.
// Data is a snapshot in lib/data/sowLibrary.json (see its _note). Replace it as more SOWs are written.
import raw from '@/lib/data/sowLibrary.json';
import type { LibraryProfile, LibraryResponse } from '@/lib/types';

const profiles = raw.profiles as LibraryProfile[];

export const library = (): LibraryResponse => ({ note: raw._note, profiles });
export const findProfile = (id: string): LibraryProfile | undefined => profiles.find((p) => p.id === id);
