// types/stepper.ts
export type Step = {
  title: string;
  content: React.ReactNode;
  isOptional?: boolean;
  isDisabled?: boolean;
  validationFn?: () => boolean | Promise<boolean>;
};
