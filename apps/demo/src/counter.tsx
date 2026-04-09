import { useState } from "react";

export const Counter = ({ label = "React Counter" }: { label?: string }) => {
  const [count, setCount] = useState(0);

  return (
    <div className="react-counter">
      <span>{label}: {count}</span>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <button onClick={() => setCount((c) => c - 1)}>-</button>
    </div>
  );
};
