import type { MessageTemplate, Student } from "../types";

export const applyTemplate = (
  template: MessageTemplate,
  values: Record<string, string>
): { message: string; unresolved: string[] } => {
  const unresolved = new Set(template.variables);
  let message = template.content;
  template.variables.forEach((variable) => {
    const token = `{{${variable}}}`;
    if (values[variable]) {
      message = message.replaceAll(token, values[variable]);
      unresolved.delete(variable);
    }
  });
  return {
    message,
    unresolved: Array.from(unresolved)
  };
};

export const hydrateAttendanceTemplate = (
  direction: "entry" | "exit",
  template: MessageTemplate,
  student: Student,
  timestamp: string
) => {
  const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return applyTemplate(template, {
    "1": student.parentPrimaryPhone,
    "2": `${student.firstName} ${student.lastName}`,
    "3": formattedTime
  });
};

