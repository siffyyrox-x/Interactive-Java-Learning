import { useEffect, useState } from 'react';
import { actions, getProgress } from '../lib/progress';
import { runJava } from '../engine/java';
import { CodeEditor } from '../components/LazyEditor';
import { Visualizer, RunOutput } from '../components/Visualizer';
import { java } from '../content/model';

const EXAMPLES: { name: string; code: string; input?: string }[] = [
  { name: 'Hello + input', input: 'Rahim 19', code: java`
    import java.util.Scanner;

    public class Main {
        public static void main(String[] args) {
            Scanner sc = new Scanner(System.in);
            System.out.print("Name and age: ");
            String name = sc.next();
            int age = sc.nextInt();
            System.out.println("Hi " + name + ", in 5 years you will be " + (age + 5));
        }
    }
  ` },
  { name: 'Reverse a number', input: '4071', code: java`
    import java.util.Scanner;

    public class Main {
        public static void main(String[] args) {
            Scanner sc = new Scanner(System.in);
            int n = sc.nextInt();
            int rev = 0;
            while (n > 0) {
                rev = rev * 10 + n % 10;
                n /= 10;
            }
            System.out.println(rev);
        }
    }
  ` },
  { name: 'Selection sort', code: java`
    public class Main {
        public static void main(String[] args) {
            int[] a = {29, 10, 14, 37, 13};
            for (int i = 0; i < a.length - 1; i++) {
                int min = i;
                for (int j = i + 1; j < a.length; j++) {
                    if (a[j] < a[min]) min = j;
                }
                int t = a[i]; a[i] = a[min]; a[min] = t;
            }
            for (int v : a) System.out.print(v + " ");
            System.out.println();
        }
    }
  ` },
  { name: 'String scan', code: java`
    public class Main {
        public static void main(String[] args) {
            String s = "ab12cd3e45";
            int sum = 0, cur = 0;
            for (int i = 0; i < s.length(); i++) {
                char c = s.charAt(i);
                if (c >= '0' && c <= '9') {
                    cur = cur * 10 + (c - '0');
                } else {
                    sum += cur;
                    cur = 0;
                }
            }
            sum += cur;
            System.out.println(sum);
        }
    }
  ` },
  { name: 'Recursion', code: java`
    public class Main {
        public static void main(String[] args) {
            System.out.println(power(2, 5));
        }
        public static int power(int b, int e) {
            if (e == 0) return 1;
            return b * power(b, e - 1);
        }
    }
  ` },
];

export function LabPage() {
  const saved = getProgress();
  const [code, setCode] = useState(saved.labCode ?? EXAMPLES[0].code);
  const [input, setInput] = useState(saved.labInput ?? EXAMPLES[0].input ?? '');
  const [run, setRun] = useState<ReturnType<typeof runJava> | null>(null);
  const [viz, setViz] = useState<{ code: string; input: string } | null>(null);
  useEffect(() => { const t = setTimeout(() => actions.saveLab(code, input), 500); return () => clearTimeout(t); }, [code, input]);
  const errLine = run?.error?.kind === 'compile' ? run.error.line : null;
  return (
    <main className="wrap">
      <span className="eyebrow">Lab</span>
      <h1>Write any program, watch it run</h1>
      <p className="lede">A scratchpad for the Java covered in this course. Run it for the output, or visualize it to step through every line. Your code is kept on this device.</p>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="mono tiny muted">Load an example:</span>
        {EXAMPLES.map(e => <button key={e.name} className="chip" onClick={() => { if (code === e.code || confirm('Replace your code with this example?')) { setCode(e.code); setInput(e.input ?? ''); setRun(null); setViz(null); } }}>{e.name}</button>)}
      </div>
      <div className="stack">
        <CodeEditor value={code} onChange={v => { setCode(v); }} errorLine={errLine} title="Main.java" minLines={16} />
        <label className="field">Input (what the user types — separate values with spaces or new lines)
          <textarea rows={3} value={input} onChange={e => setInput(e.target.value)} spellCheck={false} />
        </label>
        <div className="row">
          <button className="btn" onClick={() => { setRun(runJava(code, { stdin: input })); setViz(null); }}>Run</button>
          <button className="btn ghost" onClick={() => { setViz({ code, input }); setRun(null); }}>Visualize step by step</button>
        </div>
        {run && <div><div className="pane-title">Output</div><RunOutput result={run} /></div>}
        {viz && <Visualizer source={viz.code} stdin={viz.input} title="Your program" />}
        <details className="result">
          <summary><span className="mono small">?</span><span>What Java does this lab support?</span></summary>
          <div style={{ padding: '10px 14px' }} className="small">
            One class with static methods (or just statements — they are wrapped in <code>main</code> for you); <code>int long double float char boolean String</code>; arrays including 2-D; <code>if / else / switch / while / do-while / for / for-each / break / continue</code>; <code>Scanner</code> (nextInt, nextDouble, next, nextLine, hasNext…); <code>String</code> and <code>StringBuilder</code> methods, <code>Math</code>, <code>Integer / Double / Character</code> helpers, <code>printf / String.format</code>, recursion. Classes, objects and collections are outside the course and not supported. Runaway loops and recursion are stopped safely.
          </div>
        </details>
      </div>
    </main>
  );
}
