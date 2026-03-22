import sopOutline from "./sop-outline";
import projectCharterOutline from "./project-charter-outline";
import incidentPostmortemOutline from "./incident-postmortem-outline";
import vendorAssessmentOutline from "./vendor-assessment-outline";
import deliveryRunbookOutline from "./delivery-runbook-outline";
import type { Template } from "../index";

export const OPERATIONS_DELIVERY_BLUEPRINTS: Template[] = [
  sopOutline,
  projectCharterOutline,
  incidentPostmortemOutline,
  vendorAssessmentOutline,
  deliveryRunbookOutline,
];

export {
  sopOutline,
  projectCharterOutline,
  incidentPostmortemOutline,
  vendorAssessmentOutline,
  deliveryRunbookOutline,
};
