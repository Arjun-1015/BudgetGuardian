export interface NotificationInput {
  riskLevel: "safe" | "warning" | "danger";
  daysLeft: number;
  dailyBudget: number;
  todaysSpend: number;
  remainingBalance: number;
  upcomingBills: { id: string; name: string; amount: number; dueDate: Date; isPaid: boolean }[];
  today?: Date;
}

export interface AppNotification {
  id: string;
  severity: "info" | "warning" | "danger";
  message: string;
}

export function buildNotifications(input: NotificationInput): AppNotification[] {
  const today = input.today ?? new Date();
  const notifications: AppNotification[] = [];

  if (input.riskLevel === "danger") {
    notifications.push({
      id: "risk-danger",
      severity: "danger",
      message: "High risk: you may run out of money before your next salary.",
    });
  }

  if (input.daysLeft <= 3) {
    notifications.push({
      id: "salary-near",
      severity: "info",
      message: `Salary is near — ${input.daysLeft} day${input.daysLeft === 1 ? "" : "s"} left.`,
    });
  }

  if (input.todaysSpend > input.dailyBudget && input.dailyBudget > 0) {
    notifications.push({
      id: "safe-spend-exceeded",
      severity: "warning",
      message: `You've spent past today's safe limit of ₹${Math.round(input.dailyBudget).toLocaleString("en-IN")}.`,
    });
  }

  if (input.remainingBalance < 0) {
    notifications.push({
      id: "budget-exceeded",
      severity: "danger",
      message: "Your expenses have exceeded your income this cycle.",
    });
  }

  for (const bill of input.upcomingBills) {
    if (bill.isPaid) continue;
    const daysUntilDue = Math.round((bill.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 5 && daysUntilDue >= 0) {
      notifications.push({
        id: `bill-${bill.id}`,
        severity: daysUntilDue <= 1 ? "danger" : "warning",
        message: `${bill.name} (₹${Math.round(bill.amount).toLocaleString("en-IN")}) is due ${
          daysUntilDue === 0 ? "today" : `in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`
        }.`,
      });
    } else if (daysUntilDue < 0) {
      notifications.push({
        id: `bill-overdue-${bill.id}`,
        severity: "danger",
        message: `${bill.name} is overdue.`,
      });
    }
  }

  if (today.getDate() === 1) {
    notifications.push({
      id: "monthly-report-ready",
      severity: "info",
      message: "Your monthly report is ready to view.",
    });
  }

  return notifications;
}
