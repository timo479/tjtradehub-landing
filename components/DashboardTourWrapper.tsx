"use client";
import OnboardingTour from "./OnboardingTour";
import { DASHBOARD_STEPS } from "./tourSteps";

interface Props {
  alreadyCompleted: boolean;
  waitForFounder: boolean;
}

export default function DashboardTourWrapper({ alreadyCompleted, waitForFounder }: Props) {
  return (
    <OnboardingTour
      tour="dashboard"
      steps={DASHBOARD_STEPS}
      alreadyCompleted={alreadyCompleted}
      waitForFounder={waitForFounder}
    />
  );
}
