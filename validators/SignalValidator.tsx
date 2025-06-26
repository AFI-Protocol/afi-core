/* SignalValidator.tsx
   Basic scaffold for AFI's Signal Validation UI component.
   Replace mock hooks with real API once available. */
import React, { useState } from 'react';

interface SignalPayload { id: string; content: string; }

interface Props {
  signal: SignalPayload;
  onScore: (score: number) => void;
}

const SignalValidator: React.FC<Props> = ({ signal, onScore }) => {
  const [score, setScore] = useState<number>(0);
  return (
    <div style={{border:'1px solid #ccc', padding:'1rem', borderRadius:8}}>
      <h2>Validate Signal #{signal.id}</h2>
      <pre style={{background:'#111', color:'#eee', padding:'0.5rem'}}>{signal.content}</pre>
      <input type='number' min={0} max={100} value={score}
             onChange={e => setScore(parseInt(e.target.value))}/>
      <button onClick={()=>onScore(score)}>Submit</button>
    </div>
  );
};
export default SignalValidator;
