import { Calculator } from "@/components/calculator";
import { ModelDetails } from "@/components/model-details";

export default function App() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-10 sm:py-16">
      <Calculator />
      <ModelDetails />
    </main>
  );
}
