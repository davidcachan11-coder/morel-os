import "server-only";

/**
 * Operational alert thresholds. These are configured defaults, not facts
 * discovered from the business — there is no documented SLA anywhere in
 * docs/ to derive them from (DASHBOARD_SPEC.md's Operations section
 * flags "SLA breach highlighting" as a planned feature without a number).
 * Picking a labeled, defensible default and saying so explicitly is the
 * honest move here — the alternative (not shipping this alert at all)
 * loses real value, and silently picking a number without flagging it
 * would misrepresent it as a discovered fact. Should become
 * admin-configurable once there's a real settings surface
 * (app/admin/(app)/configuracion is still a placeholder).
 */
export const STUCK_ORDER_THRESHOLD_MINUTES = 60;
export const REVENUE_DECLINE_ALERT_THRESHOLD_PCT = -20;

export interface OperationalAlert {
  id: string;
  severity: "warning" | "info";
  title: string;
  description: string;
}
