import React, { useMemo, useState } from "react";
import { useApi } from "../context/ApiContext";
import { Button } from "../components/Button";
import { Input, Select } from "../components/Input";
import type { RosterRow } from "../types";
import { useToast } from "../context/ToastContext";
import { isE164Phone, isValidEmail, isValidCGPA, isValidAttendancePercentage } from "../utils/formatters";

const requiredFields: { key: keyof RosterRow["data"]; label: string }[] = [
  { key: "student_id", label: "Student_ID" },
  { key: "name", label: "Name" },
  { key: "gender", label: "Gender" },
  { key: "department", label: "Department" },
  { key: "year_of_study", label: "Year_of_Study" },
  { key: "cgpa", label: "CGPA" },
  { key: "email", label: "Email" },
  { key: "phone_number", label: "Phone_Number" },
  { key: "parent_number", label: "Parent_Number" },
  { key: "city", label: "City" },
  { key: "attendance_percentage", label: "Attendance_Percentage" }
];

const validateRows = (rows: RosterRow[]): RosterRow[] => {
  const seen = new Map<string, string>();
  return rows.map((row) => {
    const errors = new Set<string>();
    requiredFields.forEach((field) => {
      if (!row.data[field.key]) {
        errors.add(`${field.label} required`);
      }
    });
    if (row.data.email && !isValidEmail(row.data.email)) {
      errors.add("Invalid email format");
    }
    if (row.data.phone_number && !isE164Phone(row.data.phone_number)) {
      errors.add("Invalid phone number (must be exactly 10 digits)");
    }
    if (row.data.parent_number && !isE164Phone(row.data.parent_number)) {
      errors.add("Invalid parent number (must be exactly 10 digits)");
    }
    if (row.data.cgpa && !isValidCGPA(row.data.cgpa)) {
      errors.add("Invalid CGPA (must be between 0 and 10)");
    }
    if (row.data.attendance_percentage && !isValidAttendancePercentage(row.data.attendance_percentage)) {
      errors.add("Invalid attendance percentage (must be between 0 and 100)");
    }
    const seenRow = seen.get(row.data.student_id);
    if (seenRow) {
      errors.add("Duplicate student ID");
      return { ...row, errors: Array.from(errors), duplicateOf: seenRow };
    }
    if (row.data.student_id) seen.set(row.data.student_id, row.rowId);
    return { ...row, errors: Array.from(errors), duplicateOf: undefined };
  });
};

export const Roster: React.FC = () => {
  const {
    rosterUpload,
    loadRosterPreview,
    setRosterUploadState,
    updateRosterMapping,
    updateRosterRows,
    mapRosterColumns,
    saveRoster,
    clearRosterPreview
  } = useApi();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const columns = rosterUpload?.columns ?? [];
  const mapping = rosterUpload?.mapping ?? {};
  const rows = rosterUpload?.rows ?? [];

  const duplicates = useMemo(() => rows.filter((row) => row.duplicateOf), [rows]);
  const errors = useMemo(() => rows.filter((row) => row.errors.length > 0), [rows]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    if (!file) return;
    setLoading(true);
    try {
      const result = await loadRosterPreview(file);
      
      // The API parser should already clean the columns, so use them directly
      // But ensure we have valid columns for the mapping dropdown
      const columnsToUse = result.columns.filter((col) => col && col.length > 0);
      
      if (columnsToUse.length === 0) {
        throw new Error("No valid columns found in file");
      }
      
      const defaultMapping: Record<string, string> = {};
      requiredFields.forEach((field) => {
        // Try to find a column that matches the field name
        const fieldKeyLower = field.key.replace(/_/g, " ").toLowerCase();
        const column = columnsToUse.find((col) => {
          const colLower = col.toLowerCase();
          return colLower.includes(fieldKeyLower) || 
                 colLower.includes(field.label.toLowerCase()) ||
                 (fieldKeyLower.includes("student_id") && colLower.includes("id")) ||
                 (fieldKeyLower.includes("phone") && colLower.includes("phone")) ||
                 (fieldKeyLower.includes("email") && colLower.includes("email")) ||
                 (fieldKeyLower.includes("name") && colLower.includes("name"));
        });
        defaultMapping[field.key] = column ?? columnsToUse[0];
      });
      const mappedRows = await mapRosterColumns(defaultMapping, result.rows);
      const validatedRows = validateRows(mappedRows);
      setRosterUploadState({
        columns: columnsToUse, // Use cleaned columns from API
        mapping: defaultMapping,
        originalRows: result.rows,
        rows: validatedRows
      });
      push({ status: "success", title: "File parsed", description: "Columns ready for mapping." });
    } catch (error) {
      push({ status: "error", title: "Parse error", description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = async (key: string, value: string) => {
    if (!rosterUpload) return;
    const nextMapping = { ...mapping, [key]: value };
    const remapped = await mapRosterColumns(nextMapping, rosterUpload.originalRows);
    const validatedRows = validateRows(remapped);
    setRosterUploadState({
      ...rosterUpload,
      mapping: nextMapping,
      rows: validatedRows
    });
  };

  const handleRowChange = (rowId: string, field: keyof RosterRow["data"], value: string) => {
    if (!rosterUpload) return;
    const updatedRows = validateRows(
      rosterUpload.rows.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              data: {
                ...row.data,
                [field]: value
              }
            }
          : row
      )
    );
    updateRosterRows(updatedRows);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveRoster(rows);
      push({
        status: "success",
        title: "Roster saved",
        description: `${result.successCount} students synced · ${result.failureCount} issues`
      });
      clearRosterPreview();
    } catch (error) {
      push({ status: "error", title: "Upload failed", description: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Upload Roster (CSV/XLSX)</h2>
              <p className="text-sm text-[rgb(var(--text-muted))]">Map fields before committing to the database.</p>
            </div>
            <div className="flex items-center gap-3">
              {rosterUpload && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    clearRosterPreview();
                    push({ status: "success", title: "Cleared", description: "Uploaded data removed." });
                  }}
                >
                  Clear
                </Button>
              )}
              <label className="focus-ring inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-primary/60 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20">
                Choose file
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  className="sr-only"
                  aria-label="Upload CSV or Excel roster file"
                  disabled={loading}
                />
              </label>
            </div>
          </div>
        {loading && <p className="mt-4 text-sm text-[rgb(var(--text-muted))]">Parsing file...</p>}
        {columns.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Field Mapping</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {requiredFields.map((field) => (
                <div key={field.key} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-[rgb(var(--text-muted))]">{field.label}</p>
                  <Select
                    className="mt-2"
                    value={mapping[field.key] ?? ""}
                    onChange={(event) => handleMappingChange(field.key, event.target.value)}
                  >
                    {columns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {rows.length > 0 && (
        <section className="surface-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Preview & Validation</h2>
              <p className="text-sm text-[rgb(var(--text-muted))]">
                Inline edit any issues. Duplicate IDs and invalid phones are flagged automatically.
              </p>
            </div>
            <Button variant="primary" onClick={handleSave} disabled={saving || rows.length === 0}>
              Save to DB
            </Button>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/5">
            <table className="min-w-full divide-y divide-white/5 text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">Row</th>
                  {requiredFields.map((field) => (
                    <th
                      key={field.key}
                      className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]"
                    >
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">
                    Issues
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row, index) => (
                  <tr key={row.rowId} className="transition hover:bg-white/5">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[rgb(var(--text-muted))]">{index + 1}</td>
                    {requiredFields.map((field) => (
                      <td key={field.key} className="px-4 py-3">
                        <Input
                          value={row.data[field.key] ?? ""}
                          onChange={(event) => handleRowChange(row.rowId, field.key, event.target.value)}
                          aria-label={`${field.label} row ${index + 1}`}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      {row.errors.length > 0 ? (
                        <ul className="space-y-1 text-xs text-rose-300">
                          {row.errors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-emerald-300">Valid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-4 text-xs text-amber-100">
              <p className="font-semibold uppercase tracking-wide">Dedupe Suggestions</p>
              {duplicates.length === 0 ? (
                <p className="mt-2 text-[rgb(var(--text-muted))]">No duplicate student IDs detected.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {duplicates.map((row) => (
                    <li key={row.rowId}>
                      {row.data.student_id} duplicates row {row.duplicateOf}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-3xl border border-rose-400/40 bg-rose-500/10 p-4 text-xs text-rose-100">
              <p className="font-semibold uppercase tracking-wide">Validation Summary</p>
              {errors.length === 0 ? (
                <p className="mt-2 text-[rgb(var(--text-muted))]">All rows look good.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {errors.map((row) => (
                    <li key={row.rowId}>
                      Row {row.data.name || row.rowId}: {row.errors.join(", ")}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

