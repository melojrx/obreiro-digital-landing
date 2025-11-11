export interface ImportError {
  line: number;
  messages: string[];
}

export interface BulkImportResult {
  total_rows: number;
  success_count: number;
  error_count: number;
  duplicates_skipped: number;
  errors: ImportError[];
  imported_member_ids: number[];
  branch_id?: number | null;
}

export interface BulkUploadPayload {
  file: File;
  branchId?: number;
  skipDuplicates?: boolean;
}
