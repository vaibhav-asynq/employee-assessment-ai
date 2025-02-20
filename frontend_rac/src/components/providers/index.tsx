import { Path2Provider } from "../interview/context/Path2Context";
import { InterviewProvider } from "./InterviewContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InterviewProvider>
        <Path2Provider>{children}</Path2Provider>
      </InterviewProvider>
    </>
  );
}
