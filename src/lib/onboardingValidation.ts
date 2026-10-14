import { validateLocationInput } from "./onboardingLocation";

// G1: name, category and a valid location are what scoring, question
// generation and local search all depend on. The rest of the wizard stays optional.
export type RequiredStep = "name" | "category" | "location";
export type Problem<S extends string = string> = { step: S; message: string };

export function requiredFieldProblem<S extends string>(
  step: S,
  values: { name: string; category: string; location: string },
): Problem<S> | null {
  if (step === "name" && !values.name.trim()) return { step, message: "Give your business a name." };
  if (step === "category" && !values.category.trim()) {
    return { step, message: "Pick the closest category - it helps us ask AI the right questions about you." };
  }
  if (step === "location") {
    const locationError = validateLocationInput(values.location);
    if (locationError) return { step, message: locationError };
  }
  return null;
}

/** Why "Continue" must be disabled right now (null = it may be enabled). On the
 *  last step all three required fields are re-checked, so clearing one after
 *  moving on can't slip through. */
export function continueBlockedReason<S extends string>(
  step: S,
  isLastStep: boolean,
  values: { name: string; category: string; location: string },
): Problem<string> | null {
  const here = requiredFieldProblem(step, values);
  if (here) return here;
  if (!isLastStep) return null;
  return (
    requiredFieldProblem("name", values) ||
    requiredFieldProblem("category", values) ||
    requiredFieldProblem("location", values)
  );
}
