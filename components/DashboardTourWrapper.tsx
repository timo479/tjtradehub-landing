"use client";
import OnboardingTour from "./OnboardingTour";
import { DASHBOARD_STEPS } from "./tourSteps";

interface Props {
  alreadyCompleted: boolean;
}

export default function DashboardTourWrapper({ alreadyCompleted }: Props) {
  return (
    <OnboardingTour
      tour="dashboard"
      steps={DASHBOARD_STEPS}
      alreadyCompleted={alreadyCompleted}
    />
  );
}
