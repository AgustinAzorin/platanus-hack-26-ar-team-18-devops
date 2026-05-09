import type { Recording as PrismaRecording } from '@repo/database';
import type { Recording as ApiRecording } from '@repo/types/recordings';

export type RecordingModel = ApiRecording;

export function toApi(row: PrismaRecording): RecordingModel {
  return {
    id: row.id,
    workId: row.workId,
    isrc: row.isrc,
    versionLabel: row.versionLabel,
    audioUrl: row.audioUrl,
    dawProjectUrl: row.dawProjectUrl,
    recordedAt: row.recordedAt,
  };
}
