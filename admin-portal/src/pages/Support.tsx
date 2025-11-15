import React from "react";
import { useApi } from "../context/ApiContext";
import { Button } from "../components/Button";
import { useToast } from "../context/ToastContext";

const downloadBlob = (filename: string, content: string, type = "text/csv") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const Support: React.FC = () => {
  const { notifications, students } = useApi();
  const { push } = useToast();

  const exportLogs = () => {
    const header = "timestamp,student,parent_phone,channel,status,attempts\n";
    const rows = notifications
      .map(
        (log) =>
          `${log.timestamp},${log.studentName},${log.parentPhone},${log.channel},${log.status},${log.attempts}`
      )
      .join("\n");
    downloadBlob("notification-logs.csv", header + rows);
    push({ status: "success", title: "Export ready", description: "Notification logs downloaded." });
  };

  const downloadSample = () => {
    const header = "Student_ID,Name,Gender,Department,Year_of_Study,CGPA,Email,Phone_Number,Parent_Number,City,Attendance_Percentage\n";
    // Generate sample data based on new schema
    const sampleRows = [
      "STU001,John Doe,Male,Engineering,2nd,8.5,john.doe@example.com,+919876543210,+919876543220,Mumbai,85.5",
      "STU002,Jane Smith,Female,B.com,3rd,9.2,jane.smith@example.com,+919876543211,+919876543221,Delhi,92.0",
      "STU003,Bob Johnson,Male,IT,1st,7.8,bob.johnson@example.com,+919876543212,+919876543222,Bangalore,78.3"
    ].join("\n");
    downloadBlob("roster-sample.csv", header + sampleRows);
    push({ status: "info", title: "Sample generated", description: "Roster template downloaded." });
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Support & Exports</h2>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          Use these tools to share data with faculty or migrate to your SIS.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Export Delivery Logs</h3>
            <p className="mt-2 text-xs text-[rgb(var(--text-muted))]">
              Generates CSV containing notification history for audits or external reporting.
            </p>
            <Button variant="secondary" className="mt-4" onClick={exportLogs}>
              Download Logs CSV
            </Button>
          </div>
          <div className="rounded-3xl border border-white/5 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Sample Excel Template</h3>
            <p className="mt-2 text-xs text-[rgb(var(--text-muted))]">
              Start with our roster format to ensure correct column mapping during upload.
            </p>
            <Button variant="secondary" className="mt-4" onClick={downloadSample}>
              Download Sample CSV
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

