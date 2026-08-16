import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./MajorMatch.module.css";

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

type Choice = "S" | "D";

const ROUNDS: Array<{
  chapter: string;
  question: string;
  stat: { title: string; copy: string };
  ds: { title: string; copy: string };
  insight: string;
}> = [
  {
    chapter: "THE CORE QUESTION",
    question: "Which question sounds more like the work you want to do?",
    stat: { title: "What can we confidently say from this sample — and how sure are we?", copy: "Infer properties of a wider population while making uncertainty explicit." },
    ds: { title: "How accurately can we predict the next outcome — and deploy it at scale?", copy: "Build a function that performs well on future data and can be used repeatedly." },
    insight: "The source discussion frames Statistics around inference and Data Science around prediction and utility.",
  },
  {
    chapter: "THE INTELLECTUAL PULL",
    question: "Which kind of thinking would you rather practise for several years?",
    stat: { title: "Derive models from first principles", copy: "Use probability, mathematical statistics, assumptions, proofs, and interpretable reasoning." },
    ds: { title: "Build scalable systems from working components", copy: "Use programming, algorithms, machine learning, data engineering, and rapid iteration." },
    insight: "This is a difference in curricular centre of gravity — not an absolute boundary.",
  },
  {
    chapter: "THE STANDARD OF SUCCESS",
    question: "Which result would you regard as the more satisfying success?",
    stat: { title: "A transparent claim with quantified uncertainty", copy: "The assumptions are visible; the effect is interpretable; the conclusion can be defended." },
    ds: { title: "A model with strong out-of-sample performance", copy: "It predicts accurately, processes real data, and improves a practical decision or product." },
    insight: "Statistics often measures validity of a conclusion; Data Science often measures predictive utility.",
  },
  {
    chapter: "THE DEFINING COURSES",
    question: "Which difficult course list still sounds worth taking?",
    stat: { title: "Probability, Mathematical Statistics, Experimental Design", copy: "Possibly advanced calculus, real analysis, stochastic processes, Bayesian methods, and causal inference." },
    ds: { title: "Data Structures, Algorithms, Machine Learning, Systems", copy: "Possibly databases, distributed computing, deep learning, data engineering, and MLOps." },
    insight: "Fit often appears in the frustration you are willing to stay with.",
  },
  {
    chapter: "THE DATA REGIME",
    question: "Which data problem would you rather be responsible for?",
    stat: { title: "Extract reliable information from limited, noisy evidence", copy: "A clinical study, designed experiment, risk estimate, or scientific sample." },
    ds: { title: "Extract useful signals from massive, complex data", copy: "A platform, recommendation system, sensor stream, or continuously updated product." },
    insight: "Statistics grew around learning carefully from scarcity; Data Science around acting at scale.",
  },
  {
    chapter: "THE DELIVERABLE",
    question: "Which capstone deliverable would you be more excited to present?",
    stat: { title: "A research paper or clinical-trial analysis", copy: "A rigorous argument about evidence, effects, uncertainty, and what may be concluded." },
    ds: { title: "A deployed AI model or real-time application", copy: "A working system that ingests data, predicts, serves users, and can be monitored." },
    insight: "These examples are adapted from the deliverables contrasted in the source discussion.",
  },
  {
    chapter: "THE WORKING CULTURE",
    question: "Which professional environment feels more like your habitat?",
    stat: { title: "Statistics departments and research labs", copy: "Health, experiments, finance, risk, policy, or methodological research where validity is central." },
    ds: { title: "Computer-science departments and product teams", copy: "AI applications, data platforms, product analytics, or intelligent systems where scale is central." },
    insight: "The borders overlap, but the surrounding work culture often feels different.",
  },
  {
    chapter: "THE AI ERA",
    question: "As AI automates more routine work, where do you want your value to sit?",
    stat: { title: "Experimental design, causal reasoning, and rigorous evaluation", copy: "Audit uncertainty, bias, causal claims, and the consequences of being wrong." },
    ds: { title: "System design, integration, scale, and AI products", copy: "Build, evaluate, deploy, monitor, and improve continuously operating AI capabilities." },
    insight: "AI raises the value of both judgment and engineering — in different ways.",
  },
];

function resultFor(score: number) {
  if (score >= 7) return { label: "The Statistical Investigator", eyebrow: "STRONGLY STATISTICS-LEANING", copy: "You are drawn to evidence, mechanism, uncertainty, and conclusions that can withstand scrutiny.", fit: "Statistics deserves a serious look — especially biostatistics, causal inference, risk, quantitative research, and research-oriented data science." };
  if (score >= 5) return { label: "The Rigorous Explorer", eyebrow: "STATISTICS-LEANING HYBRID", copy: "You want to understand why a method works, while keeping one foot in practical data work.", fit: "A Statistics foundation combined with computing, machine learning, or domain electives could be an unusually strong fit." };
  if (score === 4) return { label: "The Bridge Builder", eyebrow: "BALANCED PROFILE", copy: "You care about both trustworthy conclusions and useful systems. Your curriculum choices may matter more than the label alone.", fit: "Compare the required courses closely. Statistics plus DS/CS electives — or DS plus deeper inference courses — can both build this profile." };
  if (score >= 2) return { label: "The Applied Modeler", eyebrow: "DATA-SCIENCE-LEANING HYBRID", copy: "You enjoy building and prediction, but you still notice questions of evidence and interpretation.", fit: "Data Science may feel natural; deeper Statistics training can distinguish you in experimentation, evaluation, and high-stakes AI." };
  return { label: "The Systems Builder", eyebrow: "STRONGLY DATA-SCIENCE-LEANING", copy: "You are energized by implementation, scale, iteration, and turning models into working systems.", fit: "Data Science is likely the clearer fit. Keep Statistics in your toolkit: uncertainty and experimental thinking make systems safer and smarter." };
}

function GaltonBoard({ run, total }: { run: number; total: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const width = 620;
    const height = 620;
    canvas.width = width * 2;
    canvas.height = height * 2;
    context.scale(2, 2);

    const rows = 10;
    const top = 62;
    const rowGap = 31;
    const pegGap = 36;
    const binCount = rows + 1;
    const binWidth = 36;
    const boardCentre = width / 2;
    const dividerTop = 345;
    const floor = 578;
    const bins = Array(binCount).fill(0) as number[];
    const balls: Array<{ x: number; y: number; row: number; targetX: number; targetY: number; slot: number; settled: boolean }> = [];
    let spawned = 0;
    let frame = 0;
    let animation = 0;
    let finalFramePainted = false;

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#2e7190";
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "#16213c";
      context.lineWidth = 3;
      context.fillStyle = "#f5cf6b";
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col <= row; col += 1) {
          const x = boardCentre + (col - row / 2) * pegGap;
          const y = top + row * rowGap;
          context.beginPath();
          context.arc(x, y, 5, 0, Math.PI * 2);
          context.fill();
          context.stroke();
        }
      }

      const binLeft = boardCentre - (binCount * binWidth) / 2;
      context.strokeStyle = "#16213c";
      context.lineWidth = 3;
      for (let index = 0; index <= binCount; index += 1) {
        const x = binLeft + index * binWidth;
        context.beginPath();
        context.moveTo(x, dividerTop);
        context.lineTo(x, floor + 8);
        context.stroke();
      }
      context.beginPath();
      context.moveTo(binLeft, floor + 8);
      context.lineTo(binLeft + binCount * binWidth, floor + 8);
      context.stroke();

      const maxBarHeight = floor - dividerTop - 9;
      const fixedPeak = Math.max(1, total * 0.27);
      bins.forEach((count, index) => {
        const barHeight = Math.min(maxBarHeight, (count / fixedPeak) * maxBarHeight);
        context.fillStyle = "#df4a3e";
        context.beginPath();
        context.roundRect(binLeft + index * binWidth + 5, floor - barHeight, binWidth - 10, barHeight, 8);
        context.fill();
        context.stroke();
        context.fillStyle = "#f8edcf";
        context.font = "bold 12px monospace";
        context.textAlign = "center";
        context.fillText(String(count), binLeft + index * binWidth + binWidth / 2, floor + 25);
      });

      const complete = spawned === total && balls.every((ball) => ball.settled);
      if (complete && total > 1) {
        context.strokeStyle = "#f5cf6b";
        context.lineWidth = 5;
        context.beginPath();
        for (let step = 0; step <= 120; step += 1) {
          const z = -3.2 + (step / 120) * 6.4;
          const density = Math.exp(-0.5 * z * z);
          const x = binLeft + ((z + 3.2) / 6.4) * binCount * binWidth;
          const y = floor - density * maxBarHeight * 0.93;
          if (step === 0) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.stroke();
      }

      balls.forEach((ball) => {
        if (ball.settled) return;
        const speed = total === 1 ? 0.085 : 0.28;
        ball.x += (ball.targetX - ball.x) * speed;
        ball.y += (ball.targetY - ball.y) * speed;
        if (Math.abs(ball.y - ball.targetY) < 2.2) {
          if (ball.row < rows) {
            const right = Math.random() > 0.5;
            ball.slot += right ? 1 : 0;
            ball.row += 1;
            ball.targetX = boardCentre + (ball.slot - ball.row / 2) * pegGap;
            ball.targetY = top + ball.row * rowGap;
          } else {
            bins[ball.slot] += 1;
            ball.settled = true;
          }
        }
        if (ball.settled) return;
        context.fillStyle = "#df4a3e";
        context.beginPath();
        context.arc(ball.x, ball.y, 7, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      });

      frame += 1;
      const interval = total === 1 ? 1 : total === 250 ? 2 : 1;
      if (spawned < total && frame % interval === 0) {
        balls.push({ x: boardCentre, y: 20, row: 0, targetX: boardCentre, targetY: top, slot: 0, settled: false });
        spawned += 1;
      }
      const stillRunning = spawned < total || balls.some((ball) => !ball.settled);
      if (stillRunning) animation = requestAnimationFrame(draw);
      else if (!finalFramePainted) {
        finalFramePainted = true;
        animation = requestAnimationFrame(draw);
      }
    };
    draw();
    return () => cancelAnimationFrame(animation);
  }, [run, total]);

  return <canvas ref={canvasRef} className={styles.galtonCanvas} />;
}

export function MajorMatch() {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<Choice[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [galtonRun, setGaltonRun] = useState(0);
  const [galtonBalls, setGaltonBalls] = useState(250);

  const sCount = answers.filter((answer) => answer === "S").length;
  const dCount = answers.length - sCount;
  const pull = answers.length ? ((dCount - sCount) / ROUNDS.length) * 44 : 0;
  const result = useMemo(() => resultFor(sCount), [sCount]);

  const begin = () => {
    setStarted(true);
    window.setTimeout(() => document.getElementById("route")?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  const choose = (choice: Choice) => {
    const next = [...answers];
    next[round] = choice;
    setAnswers(next);
    window.setTimeout(() => {
      if (round === ROUNDS.length - 1) setShowResult(true);
      else setRound((value) => value + 1);
    }, 260);
  };

  const restart = () => {
    setAnswers([]);
    setRound(0);
    setShowResult(false);
    setStarted(true);
    document.getElementById("route")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Why Statistics navigation">
        <a href="#play" className={styles.brand}>WHY STATISTICS</a>
        <div><a href="#difference">The difference</a><a href="#stories">Three ideas</a><a href="#pathways">Pathways</a><a href="#route">Find your route</a></div>
      </nav>

      <section className={styles.playHero} id="play">
        <div className={styles.playCopy}>
          <p className={styles.kicker}>STATISTICS IS A WAY OF SEEING</p>
          <h1>Random one by one.<br />Predictable together.</h1>
          <p>Each ball takes an uncertain route. Drop enough of them and a stable pattern appears. Statistics turns noisy <strong className={styles.dataWord}>DATA</strong> into patterns we can understand — and decisions we can defend.</p>
          <div className={styles.galtonControls}>
            <button onClick={() => { setGaltonBalls(1); setGaltonRun((value) => value + 1); }}>DROP 1</button>
            <button onClick={() => { setGaltonBalls(250); setGaltonRun((value) => value + 1); }}>DROP 250</button>
            <button onClick={() => { setGaltonBalls(500); setGaltonRun((value) => value + 1); }}>DROP 500</button>
            <a href="#difference">SEE WHAT STATISTICS DOES ↓</a>
          </div>
        </div>
        <div className={styles.galtonWrap} aria-label="Animated Galton board forming a bell-shaped distribution">
          <GaltonBoard run={galtonRun} total={galtonBalls} />
          <p>Run #{galtonRun + 1} · {galtonBalls === 1 ? "one uncertain path" : `${galtonBalls} paths · the empirical curve converges to the normal density`}</p>
        </div>
      </section>

      <section className={styles.difference} id="difference">
        <p className={styles.kicker}>TWO FIELDS, DIFFERENT CENTRES OF GRAVITY</p>
        <h2>Prediction is powerful. Trust is a separate problem.</h2>
        <p className={styles.sectionLead}>Data Science asks how to predict, automate, and scale. Statistics asks what the evidence supports, how uncertain we are, and whether an observed relationship is causal.</p>
        <div className={styles.splitStatement}>
          <div><span>STATISTICS</span><strong>Inference<br />Causality<br />Uncertainty</strong><p>Reliable conclusions from limited, noisy, or high-stakes evidence.</p></div>
          <div className={styles.cross}>×</div>
          <div><span>DATA SCIENCE</span><strong>Prediction<br />Automation<br />Products</strong><p>Useful systems built from large, complex, and continuously changing data.</p></div>
        </div>
      </section>

      <section className={styles.conceptStories} id="stories">
        <p className={styles.kicker}>THREE QUESTIONS STATISTICS TRAINS YOU TO ASK</p>
        <h2>What do inference, causality, and uncertainty actually do?</h2>
        <div className={styles.storyGrid}>
          <article className={styles.teaStory}>
            <div className={styles.storyHeading}><span>01 · INFERENCE</span><h3>The Lady Tasting Tea</h3></div>
            <p className={styles.storyLead}>Can someone really taste which ingredient entered the cup first — or could a perfect result happen by chance?</p>
            <div className={styles.teaExperiment}>
              <div className={styles.teaCase}>
                <div className={`${styles.cup} ${styles.milkFirst}`}><i /><b /></div>
                <strong>MILK FIRST</strong><small>Tea descends and mixes into milk</small>
              </div>
              <div className={styles.teaVs}>?</div>
              <div className={styles.teaCase}>
                <div className={`${styles.cup} ${styles.teaFirst}`}><i /><b /></div>
                <strong>TEA FIRST</strong><small>Milk descends and mixes into tea</small>
              </div>
            </div>
            <div className={styles.trialResult}><strong>8 / 8 CORRECT</strong><span>Skill—or a lucky streak?</span></div>
            <div className={styles.storyAnswer}><b>Inference asks:</b> What is the chance she calls the next cup correctly? And how surprising is 8/8 if she were only guessing?</div>
            <p className={styles.storyFootnote}>Inspired by R. A. Fisher’s classic eight-cup experiment: the design matters as much as the result.</p>
          </article>

          <article className={styles.rainStory}>
            <div className={styles.storyHeading}><span>02 · CAUSALITY</span><h3>The Umbrella Mystery</h3></div>
            <p className={styles.storyLead}>On days with more umbrellas, traffic accidents also rise. Did umbrellas cause the accidents?</p>
            <div className={styles.causalVisuals}>
              <svg className={styles.causalChart} viewBox="0 0 320 205" role="img" aria-label="Umbrellas and accidents have a positive association">
                <line x1="67" y1="18" x2="67" y2="155"/><line x1="67" y1="155" x2="301" y2="155"/>
                <line className={styles.fitLine} x1="77" y1="137" x2="289" y2="39"/>
                {[[81,132],[99,111],[119,115],[139,94],[160,89],[181,77],[202,68],[225,59],[249,43],[279,38]].map(([x,y]) => <circle key={x} cx={x} cy={y} r="7"/>)}
                <text x="184" y="187">MORE UMBRELLAS →</text><text transform="translate(25 87) rotate(-90)">MORE ACCIDENTS →</text>
              </svg>
              <svg className={styles.causalDag} viewBox="0 0 320 190" role="img" aria-label="Rain causes both more umbrellas and more accidents, while umbrellas do not cause accidents">
                <defs><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z"/></marker></defs>
                <circle cx="160" cy="38" r="31"/><text className={styles.dagIcon} x="160" y="51">🌧️</text>
                <line x1="137" y1="62" x2="86" y2="116" markerEnd="url(#arrowhead)"/><line x1="183" y1="62" x2="234" y2="116" markerEnd="url(#arrowhead)"/>
                <line className={styles.notCause} x1="111" y1="151" x2="209" y2="151"/>
                <path className={styles.causalCross} d="M151 139 L169 163 M169 139 L151 163"/>
                <circle cx="72" cy="149" r="34"/><text className={styles.dagIcon} x="72" y="163">☂️</text>
                <circle className={styles.dagOutcome} cx="248" cy="149" r="34"/><text className={styles.dagIcon} x="248" y="161">🚗💥</text>
              </svg>
            </div>
            <p className={styles.correlationNote}><b>Correlation is not causation.</b> Two things can rise together without one causing the other. Here, rain explains both.</p>
            <div className={styles.storyAnswer}><b>Causality asks:</b> What would happen to accidents if umbrellas themselves changed, while the rain did not?</div>
          </article>

          <article className={styles.uncertaintyStory}>
            <div className={styles.storyHeading}><span>03 · UNCERTAINTY</span><h3>Same 52%. Same confidence?</h3></div>
            <p className={styles.storyLead}>Imagine two baseball analysts estimating that a rookie has a 52% chance of reaching base next time. Their headline number is identical—but their evidence is not.</p>
            <p className={styles.hypotheticalTag}>A HYPOTHETICAL BASEBALL STORY</p>
            <div className={styles.pollCompare}>
              <div><span>FIRST 10 GAMES</span><strong>52%</strong><div className={styles.wideRange}><i /></div><small>A few unusual games can move the estimate a lot</small></div>
              <div><span>FULL 162-GAME SEASON</span><strong>52%</strong><div className={styles.narrowRange}><i /></div><small>More evidence makes the estimate more stable</small></div>
            </div>
            <div className={styles.storyAnswer}><b>Uncertainty asks:</b> Not only “What is our estimate?” but also “How much could it change if we observed more games?” Same estimate; very different confidence.</div>
          </article>
        </div>
      </section>

      <section className={styles.whyStat}>
        <div className={styles.sectionNumber}>WHY<br />STATISTICS</div>
        <div>
          <p className={styles.kicker}>DEPTH THAT REMAINS USEFUL</p>
          <h2>AI can produce an answer. Statistical training helps you know when it is wrong.</h2>
          <div className={styles.reasons}>
            <article><b>01</b><h3>Depth that lasts</h3><p>Probability, inference, modelling, uncertainty and causal reasoning remain valuable when tools and frameworks change.</p></article>
            <article><b>02</b><h3>Flexible destinations</h3><p>Statistics, Biostatistics, Data Science, Operations Research, Finance and evidence-intensive industry roles all remain open.</p></article>
            <article><b>03</b><h3>Proven outcomes across profiles</h3><p>Recent cohorts show viable graduate-study and industry pathways across a wide range of academic profiles.</p></article>
            <article><b>04</b><h3>A natural bridge to DS and AI</h3><p>A rigorous Statistics foundation makes later machine-learning and data-science skills easier to learn well.</p></article>
          </div>
        </div>
      </section>

      <section className={styles.evidence}>
        <p className={styles.kicker}>CUHK-SZ STATISTICS MAJOR · RECENT COHORT SIGNALS</p>
        <h2>Statistics has supported strong progression into advanced study.</h2>
        <p className={styles.sectionLead}>The pattern is more useful than a GPA lookup table: across three recent cohorts, most recorded students pursued further study, with a meaningful share reaching PhD pathways.</p>
        <div className={styles.evidenceGrid}>
          <article>
            <div className={styles.evidenceHeader}><span>Further study</span><small>share of students with records</small></div>
            <div className={styles.metricRow}><b>2024</b><i><em style={{ width: "78%" }} /></i><strong>32/41 · 78%</strong></div>
            <div className={styles.metricRow}><b>2025</b><i><em style={{ width: "81%" }} /></i><strong>26/32 · 81%</strong></div>
            <div className={styles.metricRow}><b>2026*</b><i><em style={{ width: "89%" }} /></i><strong>39/44 · 89%</strong></div>
          </article>
          <article>
            <div className={styles.evidenceHeader}><span>PhD destinations / offers</span><small>share with at least one PhD pathway</small></div>
            <div className={styles.metricRow}><b>2024</b><i><em style={{ width: "4.9%" }} /></i><strong>2/41 · 4.9%</strong></div>
            <div className={styles.metricRow}><b>2025</b><i><em style={{ width: "12.5%" }} /></i><strong>4/32 · 12.5%</strong></div>
            <div className={styles.metricRow}><b>2026*</b><i><em style={{ width: "11.4%" }} /></i><strong>5/44 · 11.4%</strong></div>
          </article>
        </div>
        <p className={styles.methodNote}>Cohort record counts: 41 (2024), 32 (2025), and 44 (2026). *2026 figures reflect offers received as of August 2026 and are still updating; they are not necessarily final destinations. Students holding both study and employment offers may appear in both pathway categories.</p>
      </section>

      <section className={styles.pathways} id="pathways">
        <p className={styles.kicker}>WHERE CAN STATISTICS TAKE YOU?</p>
        <h2>Specialised paths — without closing the door to data careers.</h2>
        <div className={styles.pathwayList}>
          <article><span>01</span><h3>Graduate study</h3><p>Statistics, Biostatistics, Data Science, Operations Research, Finance, Public Health and related programmes.</p></article>
          <article><span>02</span><h3>Evidence-intensive work</h3><p>Clinical trials, experimental design, risk, actuarial work, quantitative research and policy evaluation.</p></article>
          <article><span>03</span><h3>Modern data roles</h3><p>Inference-focused data science, experimentation, product analytics, research engineering and AI evaluation.</p></article>
        </div>

        <div className={styles.profileLadder}>
          <div className={styles.profileIntro}>
            <span>RECENT COHORTS · POOLED</span>
            <h3>Pathways across academic profiles</h3>
          </div>
          <div className={styles.profileRows}>
            <article><span>TOP ~17%</span><div><h4>PhD and elite Master’s routes</h4><p><b>PhD:</b> Yale, Chicago, Duke, Johns Hopkins, UNC, Emory, Washington, Minnesota, SMU and CUHK(SZ).</p><p><b>Master’s:</b> Berkeley, Cornell, Northwestern, Michigan, UCL, NUS, HKU and CUHK.</p></div></article>
            <article><span>NEXT ~24%</span><div><h4>US Top 30, Hong Kong and Singapore</h4><p><b>PhD:</b> CUHK(SZ).</p><p><b>Master’s:</b> Berkeley, Chicago, Columbia, Cornell, Michigan, UPenn, Duke, UCLA, UCSD, UBC, NUS, HKU, CUHK, CUHK(SZ), CEMFI and Amsterdam.</p></div></article>
            <article><span>MIDDLE ~21%</span><div><h4>Competitive Master’s and industry</h4><p><b>PhD:</b> CUHK(SZ).</p><p><b>Master’s:</b> Berkeley, Brown, Columbia, Cornell, UCLA, Washington, CMU, JHU, NYU, USC, NUS, NTU, HKU, HKUST, CUHK and CUHK(SZ), alongside data-engineering and industry offers.</p></div></article>
            <article><span>NEXT ~21%</span><div><h4>Solid pathways remain open</h4><p>Cornell, UCLA, Michigan, Emory, Georgetown, Washington, Edinburgh, ANU, Amsterdam, NTU, HKUST, CUHK, CUHK(SZ), PolyU and CityU, plus technology and professional-services offers.</p></div></article>
          </div>
          <p className={styles.profileNote}>Approximate shares are derived from pooled sizes of the four published academic-profile bands among 112 records; they are descriptive layers, not exact individual ranks. Destinations combine offers and recorded outcomes, are not exhaustive, and may overlap. The lowest original band is intentionally not displayed.</p>
        </div>

        <div className={styles.outcomes}>
          <div className={styles.outcomesIntro}>
            <span>THE BIG PICTURE</span>
            <h3>One foundation, many directions</h3>
            <p>Across the profile layers, Statistics students move into doctoral study, specialised Master’s programmes and modern data work.</p>
          </div>
          <div className={styles.outcomeRows}>
            <article><b>Doctoral</b><p>Statistics, Biostatistics, quantitative research and related methodological fields.</p></article>
            <article><b>Master’s</b><p>Statistics, DS, OR, Finance, Public Health and other quantitative programmes worldwide.</p></article>
            <article><b>Industry</b><p>Data engineering, consulting, technology products, banking, professional services and research assistantships.</p></article>
          </div>
        </div>
        <p className={styles.outcomeNote}>Individual outcomes vary, and a major is a foundation — not an admissions or employment guarantee.</p>
      </section>

      <section className={styles.close}>
        <p className={styles.kicker}>MAKE THE CHOICE ACCURATELY</p>
        <h2>If proofs, causality and uncertainty make you curious, Statistics is not a fallback. It may be your route.</h2>
        <p>Compare the required courses. Try one derivation and one small coding project. Then ask which kind of difficulty still feels worth solving.</p>
      </section>

      <div id="route">
      {!started ? (
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>STATISTICS × DATA SCIENCE</p>
            <h1>Do you want to build the answer — or decide whether it deserves trust?</h1>
            <p className={styles.lead}>Eight choices. Two ways of thinking with data. No better major in the abstract — only a clearer match for the questions you want to spend years solving.</p>
            <button className={styles.primary} onClick={begin}>Find your route <span>→</span></button>
            <p className={styles.micro}>A reflection tool, not a psychological assessment.</p>
          </div>
          <div className={styles.heroVisual} aria-label="Statistics and Data Science pull on opposite ends of a rope">
            <div className={styles.sunburst} />
            <img src={asset("assets/major-match/tug-of-war-hero-v2.png")} alt="Statistics fox and Data Science beaver pulling opposite ends of one rope" className={styles.heroDuel} />
            <span className={styles.statFlag}>STATISTICS</span><span className={styles.dsFlag}>DATA SCIENCE</span>
          </div>
        </section>
      ) : !showResult ? (
        <section className={styles.quiz} id="top">
          <div className={styles.progressTop}>
            <button className={styles.textButton} onClick={() => { setStarted(false); setAnswers([]); setRound(0); }}>← Route introduction</button>
            <span>{String(round + 1).padStart(2, "0")} / {String(ROUNDS.length).padStart(2, "0")}</span>
          </div>
          <div className={styles.progressTrack}><i style={{ width: `${((round + 1) / ROUNDS.length) * 100}%` }} /></div>
          <p className={styles.kicker}>{ROUNDS[round].chapter}</p>
          <h2>{ROUNDS[round].question}</h2>
          <div className={styles.choices}>
            <button className={`${styles.choice} ${styles.statChoice}`} onClick={() => choose("S")}>
              <span className={styles.choiceCode}>S</span><strong>{ROUNDS[round].stat.title}</strong><small>{ROUNDS[round].stat.copy}</small>
            </button>
            <button className={`${styles.choice} ${styles.dsChoice}`} onClick={() => choose("D")}>
              <span className={styles.choiceCode}>D</span><strong>{ROUNDS[round].ds.title}</strong><small>{ROUNDS[round].ds.copy}</small>
            </button>
          </div>
          <p className={styles.insight}>{ROUNDS[round].insight}</p>
          <div className={styles.tug} aria-label={`Statistics ${sCount}, Data Science ${dCount}`}>
            <div className={styles.tugLabels}><span>STATISTICS · {sCount}</span><span>DATA SCIENCE · {dCount}</span></div>
            <div className={styles.tugField}>
              <div className={`${styles.tugCharacter} ${styles.tugCharacterStat}`}><img src={asset("assets/major-match/tug-of-war-pair-ropefree.png")} alt="" /></div>
              <div className={styles.rope}><span style={{ left: `${50 + pull}%` }}><i /></span></div>
              <div className={`${styles.tugCharacter} ${styles.tugCharacterDs}`}><img src={asset("assets/major-match/tug-of-war-pair-ropefree.png")} alt="" /></div>
            </div>
          </div>
          {round > 0 && <button className={styles.back} onClick={() => setRound((value) => value - 1)}>← Change previous answer</button>}
        </section>
      ) : (
        <section className={styles.result} id="top">
          <p className={styles.kicker}>{result.eyebrow}</p>
          <h1>{result.label}</h1>
          <p className={styles.resultLead}>{result.copy}</p>
          <div className={styles.resultScale}>
            <span className={styles.scaleStat}>S · {sCount}</span><div><i style={{ left: `${12.5 + (dCount / ROUNDS.length) * 75}%` }} /></div><span className={styles.scaleDs}>{dCount} · D</span>
          </div>
          <div className={styles.fit}><span>YOUR ROUTE NOTE</span><p>{result.fit}</p></div>
          <button className={styles.secondary} onClick={restart}>Take it again</button>
          <a className={styles.primaryLink} href="#difference">Review the field comparison ↑</a>
        </section>
      )}
      </div>
      <footer className={styles.footer}>
        <span>School of Data Science · Why Statistics</span>
        <span className={styles.footerJoke}>Statisticians build products too — this website was made by the Statistics major team.</span>
        <span className={styles.footerCredit}>
          <strong>Statistics major in the age of data science and AI</strong>
          <em>The Statistics major team, CUHK Shenzhen</em>
        </span>
      </footer>
    </main>
  );
}
