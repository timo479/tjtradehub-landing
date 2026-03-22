"use client";
import OnboardingTour from "./OnboardingTour";
import { CHARTS_STEPS } from "./tourSteps";

export default function ChartsTourWrapper({ alreadyCompleted }: { alreadyCompleted: boolean }) {
  return <OnboardingTour tour="charts" steps={CHARTS_STEPS} alreadyCompleted={alreadyCompleted} />;
}
