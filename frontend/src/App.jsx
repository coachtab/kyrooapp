import { useState, useEffect, useRef } from "react";
import { api } from "./api.js";

// ── Design tokens ────────────────────────────────────────────────────────────
const A   = "#E94560";
const CTA = "#A8E10C";
const BG  = "#0A0A0A";
const C1  = "#161618";
const C2  = "#1E1E22";
const M   = "#6B7280";
const W   = "#F5F5F5";
const BD  = "#2A2A2E";

// ── Fallback plan data (shown before API loads) ───────────────────────────────
const PLANS_FALLBACK = [
  { id: 1,  name: "Weight Loss Plan",  desc: "Calorie-deficit nutrition, metabolic conditioning, and strategic cardio. Built to burn fat.",             tag: "YOUR PACE", cat: "FAT LOSS",       icon: "fire", color: "#FF6B35" },
  { id: 2,  name: "Muscle Building",   desc: "16 weeks of pure progressive overload. Volume phases, intensity blocks, and a deload.",                   tag: "YOUR PACE", cat: "HYPERTROPHY",    icon: "arm",  color: "#E94560" },
  { id: 3,  name: "90-Day Challenge",  desc: "Three 30-day phases with escalating intensity and milestone checkpoints.",                                 tag: "90 DAYS",   cat: "TRANSFORMATION", icon: "bolt", color: "#FFC107" },
  { id: 4,  name: "Beginner Program",  desc: "Learn 5 fundamental movement patterns and finish 8 weeks confident in any gym.",                          tag: "YOUR PACE", cat: "FIRST STEPS",    icon: "leaf", color: "#4CAF50" },
  { id: 5,  name: "Home Workout",      desc: "Pure bodyweight training with progressive difficulty. No equipment needed.",                              tag: "YOUR PACE", cat: "NO GYM",         icon: "home", color: "#7C4DFF" },
  { id: 6,  name: "Swim Training",     desc: "Structured pool sessions with warm-ups, drills, main sets, and cool-downs.",                             tag: "YOUR PACE", cat: "POOL",           icon: "swim", color: "#00BCD4" },
  { id: 7,  name: "Hyrox Race Plan",   desc: "8 stations. 8km of running. Periodised plan covering technique and conditioning.",                        tag: "YOUR PACE", cat: "RACE READY",     icon: "flag", color: "#FF5722" },
  { id: 8,  name: "Marathon Plan",     desc: "Half or full 42.2km. Long run progression, tempo work, and a structured taper.",                         tag: "YOUR PACE", cat: "HALF OR FULL",   icon: "run",  color: "#2196F3" },
  { id: 9,  name: "CrossFit Program",  desc: "Strength, gymnastics, MetCons. WODs in full notation with Rx and scaled options.",                       tag: "YOUR PACE", cat: "FUNCTIONAL",     icon: "lift", color: "#FF9800" },
  { id: 10, name: "HIIT Program",      desc: "Tabata, AMRAP, EMOM, circuits. Every session a different format.",                                       tag: "YOUR PACE", cat: "HIGH INTENSITY",  icon: "zap",  color: "#F44336" },
];

const iconMap = { fire:"🔥", arm:"💪", bolt:"⚡", leaf:"🌱", home:"🏠", swim:"🏊", flag:"🏁", run:"🏃", lift:"🏋", zap:"💥", brain:"🧠", chart:"📊", clip:"📋", wave:"👋", star:"✨", heart:"❤", gear:"⚙", lock:"🔒", chat:"💬", gem:"💎", bell:"🔔", pen:"✏", medal:"🎖" };
const ic = k => iconMap[k] || "";

const fq = [
  { id:"gender", q1:"How would you", acc:"identify", q2:"yourself?", type:"sel", opts:[{label:"Man",ic:"♂"},{label:"Woman",ic:"♀"},{label:"Non-binary",ic:"⚧"},{label:"Prefer not to say",ic:""}] },
  { id:"age",    q1:"How",           acc:"old",      q2:"are you?",   type:"sli", min:14, max:80, unit:"years", def:25 },
  { id:"weight", q1:"What is your",  acc:"weight",   q2:"?",          type:"sli", min:40, max:180, unit:"kg",   def:75 },
  { id:"height", q1:"What is your",  acc:"height",   q2:"?",          type:"sli", min:140, max:220, unit:"cm",  def:175 },
  { id:"level",  q1:"What's your",   acc:"fitness level", q2:"?",     type:"sel", opts:[{label:"Complete Beginner",ic:"🌱"},{label:"Some Experience",ic:"💪"},{label:"Intermediate",ic:"🔥"},{label:"Advanced",ic:"⚡"}] },
  { id:"freq",   q1:"How many",      acc:"days per week", q2:"can you train?", type:"sel", opts:[{label:"2-3 days"},{label:"4-5 days"},{label:"6+ days"}] },
  { id:"dur",    q1:"How",           acc:"long",     q2:"is your ideal session?", type:"sel", opts:[{label:"30 minutes"},{label:"45 minutes"},{label:"60 minutes"},{label:"90+ minutes"}] },
  { id:"goal",   q1:"What",          acc:"motivates", q2:"you most?", type:"sel", opts:[{label:"Look better",ic:"✨"},{label:"Feel stronger",ic:"💪"},{label:"Improve health",ic:"❤"},{label:"Mental clarity",ic:"🧠"}] },
];

const FQ_KEYS = ["gender","age","weight","height","level","freq","dur","goal"];

// ── Shared style objects ──────────────────────────────────────────────────────
const card  = { background:C1, borderRadius:16, padding:"16px", border:"1px solid "+BD, cursor:"pointer" };
const inp   = { width:"100%", padding:"16px", background:C1, border:"1px solid "+BD, borderRadius:14, fontSize:16, color:W, outline:"none", fontFamily:"inherit", boxSizing:"border-box" };
const cta   = { width:"100%", padding:"16px", background:CTA, border:"none", borderRadius:14, fontSize:17, fontWeight:700, color:"#0A0A0A", cursor:"pointer", letterSpacing:0.3 };
const ctaO  = { width:"100%", padding:"16px", background:"transparent", border:"1.5px solid "+BD, borderRadius:14, fontSize:17, fontWeight:600, color:W, cursor:"pointer" };
const sec   = { width:"100%", padding:"16px", background:C1, border:"1px solid "+BD, borderRadius:14, fontSize:16, fontWeight:600, color:W, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10 };
const scr   = { flex:1, overflowY:"auto", overflowX:"hidden", padding:"0 24px", display:"flex", flexDirection:"column" };
const h1s   = { fontSize:28, fontWeight:800, color:W, lineHeight:1.25, margin:"24px 0 0", letterSpacing:-0.5 };
const accS  = { color:A };
const divL  = { flex:1, height:1, background:BD };
const ml    = { fontSize:12, color:M, fontWeight:500, letterSpacing:0.5 };

// ── Small components ──────────────────────────────────────────────────────────
function Chev({ c }) {
  return <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1 1l6 6-6 6" stroke={c||M} strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function BackArrow() {
  return <svg width="10" height="16" viewBox="0 0 10 16" fill="none"><path d="M9 1L2 8L9 15" stroke={W} strokeWidth="2" strokeLinecap="round"/></svg>;
}
function Bar({ step, total }) {
  return (
    <div style={{ height:4, background:C2, borderRadius:2, margin:"8px 24px 0", overflow:"hidden" }}>
      <div style={{ height:"100%", width:((step/total)*100)+"%", background:"linear-gradient(90deg,"+A+",#FF8A65)", borderRadius:2, transition:"width 0.4s ease" }} />
    </div>
  );
}
function SBar() {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 28px 0", fontSize:12, color:W, fontWeight:600 }}>
      <span>9:41</span><span style={{ fontSize:11 }}>5G</span>
    </div>
  );
}
function Tag({ color, children }) {
  const c = color||A;
  return <span style={{ display:"inline-block", padding:"4px 10px", borderRadius:20, fontSize:10, fontWeight:700, letterSpacing:1.5, color:c, border:"1px solid "+c+"30", background:c+"15" }}>{children}</span>;
}
function Nav({ act, go }) {
  const items = [{id:"home",label:"Home"},{id:"plans",label:"Plans"},{id:"tracking",label:"Track"},{id:"profile",label:"Profile"}];
  return (
    <div style={{ display:"flex", justifyContent:"space-around", padding:"10px 0 28px", borderTop:"1px solid "+BD, background:BG }}>
      {items.map(it => {
        const isAct = act===it.id;
        return (
          <button key={it.id} onClick={()=>go(it.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, fontSize:10, fontWeight:500, color:isAct?A:M, cursor:"pointer", background:"none", border:"none", fontFamily:"inherit", padding:"4px 12px" }}>
            <div style={{ width:22, height:22, borderRadius:"50%", border:"2px solid "+(isAct?A:M), display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:isAct?A:"transparent" }} />
            </div>
            <span>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Auth screens ──────────────────────────────────────────────────────────────
function Welcome({ go }) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"0 24px 40px", position:"relative" }}>
      <div style={{ position:"absolute", top:"12%", left:"50%", transform:"translateX(-50%)", opacity:0.05, fontSize:220, fontWeight:900, color:W, userSelect:"none" }}>K</div>
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ fontSize:13, fontWeight:700, letterSpacing:6, color:A, marginBottom:12 }}>KYROO</div>
        <div style={{ fontSize:36, fontWeight:800, color:W, lineHeight:1.2 }}>The <span style={accS}>Coach</span></div>
        <div style={{ fontSize:36, fontWeight:800, color:W, lineHeight:1.2 }}>in Your Pocket</div>
        <p style={{ color:M, fontSize:15, lineHeight:1.5, marginTop:16 }}>AI-powered fitness plans built entirely around you. Your goals. Your pace. Your results.</p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <button style={cta} onClick={()=>go("register")}>Get Started</button>
        <button style={ctaO} onClick={()=>go("login")}>I already have an account</button>
      </div>
    </div>
  );
}

function Login({ go, onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const data = await api.auth.login(email.trim(), password);
      onLogin(data.token, data.user);
      go("home");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={scr}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:16 }}>
        <button style={{ background:"none", border:"none", cursor:"pointer", padding:0 }} onClick={()=>go("welcome")}><BackArrow /></button>
        <div style={{ fontSize:26, fontWeight:800, color:W }}>Welcome back</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0", color:M, fontSize:14 }}><div style={divL}/><span>Sign in with email</span><div style={divL}/></div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><div style={ml}>Email Address</div><input style={inp} placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><div style={ml}>Password</div><input style={inp} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} /></div>
        <div style={{ textAlign:"right" }}><button style={{ background:"none", border:"none", color:A, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }} onClick={()=>go("reset")}>Forgot password?</button></div>
        {error && <div style={{ color:"#FF6B6B", fontSize:13, textAlign:"center" }}>{error}</div>}
        <button style={{ ...cta, marginTop:4, opacity:loading?0.6:1 }} onClick={submit} disabled={loading}>{loading?"Logging in…":"Login"}</button>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0", color:M, fontSize:14 }}><div style={divL}/><span>or</span><div style={divL}/></div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button style={sec}>Continue with Apple</button>
        <button style={sec}>Continue with Google</button>
      </div>
      <p style={{ textAlign:"center", color:M, fontSize:14, marginTop:24 }}>{"Don't have an account? "}<button style={{ background:"none", border:"none", color:A, fontWeight:600, cursor:"pointer", fontFamily:"inherit", fontSize:14 }} onClick={()=>go("register")}>Register here</button></p>
    </div>
  );
}

function Register({ go, onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const data = await api.auth.register(email.trim(), password);
      onLogin(data.token, data.user);
      go("home");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={scr}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:16 }}>
        <button style={{ background:"none", border:"none", cursor:"pointer", padding:0 }} onClick={()=>go("welcome")}><BackArrow /></button>
        <div style={{ fontSize:26, fontWeight:800, color:W }}>Sign Up</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0", color:M, fontSize:14 }}><div style={divL}/><span>With a mail address</span><div style={divL}/></div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><div style={ml}>Email Address</div><input style={inp} placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><div style={ml}>Password</div><input style={inp} type="password" placeholder="Choose a password (min. 6 chars)" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} /></div>
        {error && <div style={{ color:"#FF6B6B", fontSize:13, textAlign:"center" }}>{error}</div>}
        <button style={{ ...cta, marginTop:4, opacity:loading?0.6:1 }} onClick={submit} disabled={loading}>{loading?"Creating account…":"Continue"}</button>
      </div>
      <p style={{ fontSize:12, color:M, textAlign:"center", lineHeight:1.5, marginTop:8 }}>{"By continuing, you agree to Kyroo's Privacy Policy and Terms and Conditions"}</p>
      <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0", color:M, fontSize:14 }}><div style={divL}/><span>or</span><div style={divL}/></div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button style={sec}>Continue with Apple</button>
        <button style={sec}>Continue with Google</button>
      </div>
      <p style={{ textAlign:"center", color:M, fontSize:14, marginTop:20, paddingBottom:16 }}>{"Already have an account? "}<button style={{ background:"none", border:"none", color:A, fontWeight:600, cursor:"pointer", fontFamily:"inherit", fontSize:14 }} onClick={()=>go("login")}>Login</button></p>
    </div>
  );
}

function Reset({ go }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try { await api.auth.forgotPassword(email.trim()); go("resetsent"); }
    finally { setLoading(false); }
  };

  return (
    <div style={scr}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:16 }}>
        <button style={{ background:"none", border:"none", cursor:"pointer", padding:0 }} onClick={()=>go("login")}><BackArrow /></button>
        <div style={{ fontSize:26, fontWeight:800, color:W }}>Reset <span style={accS}>Password</span></div>
      </div>
      <p style={{ color:M, fontSize:15, lineHeight:1.6, marginTop:16 }}>{"Enter your email and we'll send you a link to reset your password."}</p>
      <div style={{ marginTop:24 }}>
        <div style={ml}>Email Address</div>
        <input style={inp} placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
        <button style={{ ...cta, marginTop:16, opacity:loading?0.6:1 }} onClick={submit} disabled={loading}>{loading?"Sending…":"Send Reset Link"}</button>
      </div>
    </div>
  );
}

function ResetSent({ go }) {
  return (
    <div style={{ ...scr, alignItems:"center", justifyContent:"center", textAlign:"center" }}>
      <div style={{ width:80, height:80, borderRadius:"50%", background:A+"20", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24, fontSize:32 }}>✉️</div>
      <div style={{ fontSize:28, fontWeight:800, color:W }}>Check your <span style={accS}>inbox</span></div>
      <p style={{ color:M, fontSize:15, lineHeight:1.6, marginTop:12 }}>{"We've sent a password reset link to your email."}</p>
      <button style={{ ...cta, marginTop:32 }} onClick={()=>go("login")}>Back to Login</button>
    </div>
  );
}

// ── Main app screens ──────────────────────────────────────────────────────────
function Home({ go, sp, user, plans }) {
  const feat = plans.slice(0,3);
  const days = ["M","T","W","T","F","S","S"];
  const firstName = user?.name?.split(" ")[0] || "there";
  return (
    <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
      <div style={{ padding:"16px 24px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={ml}>GOOD MORNING</div>
            <div style={{ fontSize:24, fontWeight:800, color:W, marginTop:4 }}>{firstName} 👋</div>
          </div>
          <button onClick={()=>go("profile")} style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,"+A+",#FF8A65)", border:"none", cursor:"pointer", fontSize:16, fontWeight:700, color:W }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "K"}
          </button>
        </div>
        <div style={{ ...card, marginTop:20, background:"linear-gradient(135deg,#1A1A2E,"+C1+")", border:"1px solid "+A+"30" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ fontSize:14, fontWeight:600, color:W }}>This Week</span>
            <Tag>4 of 5 days</Tag>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {days.map((d,i)=>(
              <div key={i} style={{ flex:1, textAlign:"center" }}>
                <div style={{ height:4, borderRadius:2, background:i<4?CTA:BD, marginBottom:6 }} />
                <span style={{ fontSize:11, color:i<4?W:M }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          {[{s:"tracking",e:ic("chart"),l:"Track"},{s:"plans",e:ic("lift"),l:"Plans"},{s:"program",e:ic("clip"),l:"My Plan"}].map((a,i)=>(
            <button key={i} onClick={()=>go(a.s)} style={{ flex:1, ...card, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:22 }}>{a.e}</span>
              <span style={{ fontSize:11, fontWeight:600, color:W }}>{a.l}</span>
            </button>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:24, marginBottom:10 }}>
          <span style={{ fontSize:17, fontWeight:700, color:W }}>Featured Plans</span>
          <button style={{ background:"none", border:"none", color:A, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }} onClick={()=>go("plans")}>See all →</button>
        </div>
        {feat.map(p=>(
          <button key={p.id} style={{ ...card, display:"flex", gap:14, alignItems:"center", textAlign:"left", width:"100%", marginBottom:10 }} onClick={()=>{sp(p);go("detail");}}>
            <div style={{ width:48, height:48, borderRadius:14, background:p.color+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{ic(p.icon)}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:W }}>{p.name}</div>
              <div style={{ fontSize:12, color:M, marginTop:2 }}>{p.tag+" • "+p.cat}</div>
            </div>
            <Chev />
          </button>
        ))}
        <div style={{ height:8 }} />
      </div>
      <Nav act="home" go={go} />
    </div>
  );
}

function Plans({ go, sp, plans }) {
  return (
    <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
      <div style={{ padding:"16px 24px 0" }}>
        <div style={h1s}>Choose Your <span style={accS}>Plan</span></div>
        <p style={{ color:M, fontSize:14, marginTop:8, marginBottom:16 }}>Every plan is personalized by AI to match your body, goals, and lifestyle.</p>
        {plans.map(p=>(
          <button key={p.id} style={{ ...card, textAlign:"left", width:"100%", padding:0, overflow:"hidden", marginBottom:10 }} onClick={()=>{sp(p);go("detail");}}>
            <div style={{ height:3, background:"linear-gradient(90deg,"+p.color+","+p.color+"60)" }} />
            <div style={{ padding:"12px 16px", display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:p.color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{ic(p.icon)}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:700, color:W }}>{p.name}</div>
                <div style={{ fontSize:12, color:M, marginTop:3, lineHeight:1.4 }}>{p.desc||p.description}</div>
                <div style={{ marginTop:8 }}><Tag color={p.color}>{p.tag+" • "+(p.cat||p.category)}</Tag></div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <Nav act="plans" go={go} />
    </div>
  );
}

function Detail({ go, plan, ss }) {
  if (!plan) return null;
  const feats = ["Fully personalized training schedule","Progressive overload built in","Rest day optimization","Motivation check-ins"];
  return (
    <div style={scr}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:16 }}>
        <button style={{ background:"none", border:"none", cursor:"pointer", padding:0 }} onClick={()=>go("plans")}><BackArrow /></button>
        <Tag color={plan.color}>{plan.cat||plan.category}</Tag>
      </div>
      <div style={{ textAlign:"center", marginTop:28 }}>
        <div style={{ width:72, height:72, borderRadius:22, background:plan.color+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, margin:"0 auto" }}>{ic(plan.icon)}</div>
        <div style={{ ...h1s, textAlign:"center", marginTop:14, fontSize:26 }}>{plan.name}</div>
        <p style={{ color:M, fontSize:14, lineHeight:1.5, marginTop:10 }}>{plan.desc||plan.description}</p>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:24 }}>
        {[{l:"AI-Built",e:ic("brain")},{l:"Adaptive",e:"🔄"},{l:"Tracked",e:ic("chart")}].map((f,i)=>(
          <div key={i} style={{ flex:1, ...card, textAlign:"center", padding:"12px 6px" }}>
            <div style={{ fontSize:18 }}>{f.e}</div>
            <div style={{ fontSize:11, fontWeight:600, color:W, marginTop:6 }}>{f.l}</div>
          </div>
        ))}
      </div>
      <div style={{ ...card, marginTop:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:W, marginBottom:8 }}>What you'll get</div>
        {feats.map((item,i)=>(
          <div key={i} style={{ display:"flex", gap:10, alignItems:"center", padding:"8px 0", borderTop:i>0?"1px solid "+BD:"none" }}>
            <div style={{ width:20, height:20, borderRadius:"50%", background:CTA+"20", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={CTA} strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontSize:13, color:W }}>{item}</span>
          </div>
        ))}
      </div>
      <div style={{ flex:1 }} />
      <div style={{ padding:"16px 0 24px" }}>
        <button style={cta} onClick={()=>{ss(0);go("form");}}>Start Personalization →</button>
      </div>
    </div>
  );
}

function Form({ go, step, ss, plan, onAnswersComplete }) {
  const [slV, setSl]  = useState(null);
  const [sel, setSel] = useState(null);
  const q     = fq[step];
  const total = fq.length;

  useEffect(()=>{
    setSel(null);
    setSl(q ? q.def||null : null);
  }, [step]);

  if (!q) return null;

  const next = () => {
    const value = q.type === "sel"
      ? (sel !== null ? q.opts[sel].label : null)
      : (slV ?? q.def);

    if (step < total - 1) {
      onAnswersComplete(q.id, value, false);
      ss(step+1);
    } else {
      onAnswersComplete(q.id, value, true);
      go("generating");
    }
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <Bar step={step+1} total={total} />
      <div style={{ padding:"0 24px", flex:1, display:"flex", flexDirection:"column", overflowY:"auto" }}>
        <div style={{ ...h1s, marginTop:24 }}>{q.q1+" "}<span style={accS}>{q.acc}</span>{" "+q.q2}</div>
        {q.type==="sel" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:28 }}>
            {q.opts.map((opt,i)=>{
              const isSel = sel===i;
              return (
                <button key={i} onClick={()=>setSel(i)} style={{ ...card, display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", border:isSel?"1.5px solid "+A:"1px solid "+BD, background:isSel?A+"10":C1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    {opt.ic && <span style={{ fontSize:20, width:28, textAlign:"center" }}>{opt.ic}</span>}
                    <span style={{ fontSize:16, fontWeight:500, color:W }}>{opt.label}</span>
                  </div>
                  <Chev c={isSel?A:M} />
                </button>
              );
            })}
          </div>
        )}
        {q.type==="sli" && (
          <div style={{ marginTop:48, textAlign:"center" }}>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:8 }}>
              <span style={{ fontSize:56, fontWeight:800, color:W }}>{slV??q.def}</span>
              <span style={{ fontSize:20, color:M }}>{q.unit}</span>
            </div>
            <input type="range" min={q.min} max={q.max} value={slV??q.def} onChange={e=>setSl(Number(e.target.value))} style={{ width:"100%", marginTop:32 }} />
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:12, color:M }}>{q.min}</span>
              <span style={{ fontSize:12, color:M }}>{q.max}</span>
            </div>
          </div>
        )}
        <div style={{ flex:1 }} />
        <button style={{ ...cta, marginBottom:8, opacity:(q.type==="sel"&&sel===null)?0.4:1 }} onClick={next}>
          {step<total-1 ? "Continue" : "Generate My Plan"}
        </button>
        {step>0 && (
          <button style={{ display:"flex", alignItems:"center", gap:6, color:W, fontSize:15, fontWeight:500, cursor:"pointer", padding:"12px 0", background:"none", border:"none", fontFamily:"inherit" }} onClick={()=>ss(step-1)}>
            <BackArrow /> Back
          </button>
        )}
        <div style={{ height:16 }} />
      </div>
    </div>
  );
}

function Generating({ go, plan, answers }) {
  const [prog, setProg] = useState(0);
  const msgs = ["Analyzing your profile…","Matching exercises to goals…","Building weekly structure…","Optimizing recovery…","Finalizing your plan…"];
  const doneRef = useRef(false);

  useEffect(()=>{
    // Save questionnaire + generate program in parallel with the animation
    const save = async () => {
      try {
        const qData = {
          planId:     plan?.id    || null,
          gender:     answers.gender,
          age:        answers.age,
          weight:     answers.weight,
          height:     answers.height,
          fitnessLevel: answers.level,
          frequency:  answers.freq,
          duration:   answers.dur,
          goal:       answers.goal,
        };
        const { id: qId } = await api.questionnaire.save(qData);
        await api.programs.generate(qId);
      } catch (err) {
        console.error('[generating]', err.message);
      }
    };
    save();

    const iv = setInterval(()=>{
      setProg(p=>{
        if (p>=100) {
          clearInterval(iv);
          if (!doneRef.current) { doneRef.current=true; setTimeout(()=>go("program"),300); }
          return 100;
        }
        return p+1;
      });
    }, 50);
    return ()=>clearInterval(iv);
  }, []);

  const mi = Math.min(Math.floor(prog/20), msgs.length-1);
  return (
    <div style={{ ...scr, alignItems:"center", justifyContent:"center", textAlign:"center" }}>
      <style>{"@keyframes kspin{to{transform:rotate(360deg)}}"}</style>
      <div style={{ width:90, height:90, borderRadius:"50%", border:"3px solid "+BD, borderTopColor:A, animation:"kspin 1s linear infinite", marginBottom:28 }} />
      <div style={{ fontSize:24, fontWeight:800, color:W }}>Building your <span style={accS}>plan</span></div>
      <p style={{ color:CTA, fontSize:14, fontWeight:600, marginTop:14 }}>{msgs[mi]}</p>
      <div style={{ width:"75%", height:6, background:C2, borderRadius:3, marginTop:28, overflow:"hidden" }}>
        <div style={{ height:"100%", width:prog+"%", background:"linear-gradient(90deg,"+A+",#FF8A65)", borderRadius:3 }} />
      </div>
      <span style={{ color:M, fontSize:13, marginTop:10 }}>{prog+"%"}</span>
    </div>
  );
}

function Program({ go }) {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.programs.current()
      .then(p=>setProgram(p))
      .catch(()=>setProgram(null))
      .finally(()=>setLoading(false));
  }, []);

  // Fallback demo days if no program yet
  const days = program?.days?.length ? program.days : [
    { day_name:"Monday",    focus:"Upper Push",     exercises:["Bench Press 4x8","OHP 3x10","Incline DB 3x12","Dips 3x15"] },
    { day_name:"Tuesday",   focus:"Lower Body",      exercises:["Squats 4x8","RDL 3x10","Leg Press 3x12","Calf Raises 4x15"] },
    { day_name:"Wednesday", focus:"Rest & Recovery", exercises:["Stretching","15min walk","Foam rolling"] },
    { day_name:"Thursday",  focus:"Upper Pull",      exercises:["Deadlift 4x6","Pull-ups 4x8","Rows 3x10","Face Pulls 3x15"] },
    { day_name:"Friday",    focus:"Conditioning",    exercises:["KB Swings 4x20","Box Jumps 3x12","Burpees 3x10","Plank 3x45s"] },
  ];

  const planName = program?.plan_name || "Muscle Building";
  const week     = program?.current_week || 1;
  const total    = program?.total_weeks  || 16;

  return (
    <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
      <div style={{ padding:"16px 24px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:22, fontWeight:800, color:W }}>Your <span style={accS}>Program</span></div>
          <Tag>Week {week}/{total}</Tag>
        </div>
        <p style={{ color:M, fontSize:13, marginTop:6 }}>{planName} • Personalized for you</p>
        {loading && <p style={{ color:M, fontSize:13, marginTop:16 }}>Loading your program…</p>}
        {days.map((d,i)=>{
          const isRest = d.focus?.includes("Rest");
          const exs = Array.isArray(d.exercises) ? d.exercises : JSON.parse(d.exercises||"[]");
          return (
            <div key={i} style={{ ...card, padding:0, overflow:"hidden", marginTop:10 }}>
              <div style={{ height:3, background:isRest?BD:"linear-gradient(90deg,"+A+",#FF8A65)" }} />
              <div style={{ padding:"12px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:15, fontWeight:700, color:W }}>{d.day_name||d.day}</span>
                  <span style={{ fontSize:11, color:isRest?M:CTA, fontWeight:600 }}>{d.focus}</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
                  {exs.map((e,j)=><span key={j} style={{ padding:"4px 9px", borderRadius:8, background:C2, fontSize:11, color:"#B0B0B0" }}>{e}</span>)}
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ height:8 }} />
      </div>
      <Nav act="home" go={go} />
    </div>
  );
}

function Tracking({ go }) {
  const [habits,  setHabits]  = useState([]);
  const [mood,    setMood]    = useState(null);
  const [loading, setLoading] = useState(true);
  const moods = ["😤","😐","🙂","😊","🔥"];
  const bars  = [65,80,70,90,85,60,0];
  const dys   = ["M","T","W","T","F","S","S"];

  useEffect(()=>{
    api.tracking.today()
      .then(data=>{ setHabits(data.habits||[]); setMood(data.mood); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  const toggleHabit = async id => {
    const { completed } = await api.tracking.toggleHabit(id);
    setHabits(prev=>prev.map(h=>h.id===id ? {...h, completed} : h));
  };

  const saveMood = async idx => {
    setMood(idx);
    await api.tracking.saveMood(idx).catch(()=>{});
  };

  const done = habits.filter(h=>h.completed).length;

  return (
    <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
      <div style={{ padding:"16px 24px 0" }}>
        <div style={{ fontSize:22, fontWeight:800, color:W }}>Daily <span style={accS}>Check-in</span></div>
        <div style={{ ...card, marginTop:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:W, marginBottom:12 }}>How are you feeling?</div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            {moods.map((m,i)=>{
              const isSel = mood===i;
              return (
                <button key={i} onClick={()=>saveMood(i)} style={{ width:50, height:50, borderRadius:14, fontSize:24, background:isSel?A+"25":C2, border:isSel?"2px solid "+A:"1px solid "+BD, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{m}</button>
              );
            })}
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:20, marginBottom:8 }}>
          <span style={{ fontSize:15, fontWeight:700, color:W }}>Today's Habits</span>
          <span style={{ fontSize:12, color:CTA, fontWeight:600 }}>{loading?"…":done+"/"+habits.length}</span>
        </div>
        {loading && <p style={{ color:M, fontSize:13 }}>Loading habits…</p>}
        {habits.map(h=>(
          <div key={h.id} style={{ ...card, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", marginBottom:6 }} onClick={()=>toggleHabit(h.id)}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:26, height:26, borderRadius:7, background:h.completed?CTA:"transparent", border:h.completed?"none":"2px solid "+BD, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {h.completed && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={BG} strokeWidth="2.5" strokeLinecap="round"/></svg>}
              </div>
              <span style={{ fontSize:14, fontWeight:500, color:h.completed?W:M }}>{h.name}</span>
            </div>
            <span style={{ fontSize:11, color:A, fontWeight:700 }}>🔥 {h.streak||0}</span>
          </div>
        ))}
        <div style={{ ...card, marginTop:14 }}>
          <div style={{ fontSize:14, fontWeight:700, color:W, marginBottom:12 }}>Weekly Motivation</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:72 }}>
            {bars.map((v,i)=>(
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:"100%", height:v+"%", minHeight:v>0?6:2, borderRadius:4, background:i<5?"linear-gradient(180deg,"+A+","+A+"60)":BD }} />
                <span style={{ fontSize:10, color:i===4?W:M }}>{dys[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height:8 }} />
      </div>
      <Nav act="tracking" go={go} />
    </div>
  );
}

function Profile({ go, user, onLogout }) {
  const menu = [
    {l:"Edit Profile",       e:ic("pen")},
    {l:"My Subscriptions",   e:ic("gem")},
    {l:"Notifications",      e:ic("bell")},
    {l:"Units & Preferences",e:ic("gear")},
    {l:"Privacy & Data",     e:ic("lock")},
    {l:"Help & Support",     e:ic("chat")},
  ];
  const initials = user?.name
    ? user.name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)
    : "K";
  const stats = user?.stats || { total_workouts:0, streak:0, total_plans:0 };

  return (
    <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
      <div style={{ padding:"16px 24px 0" }}>
        <div style={{ fontSize:22, fontWeight:800, color:W, marginBottom:20 }}>Profile</div>
        <div style={{ ...card, display:"flex", alignItems:"center", gap:14, background:"linear-gradient(135deg,"+C1+",#1A1A2E)", border:"1px solid "+A+"30" }}>
          <div style={{ width:56, height:56, borderRadius:18, background:"linear-gradient(135deg,"+A+",#FF8A65)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:W }}>{initials}</div>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:W }}>{user?.name||"Kyroo User"}</div>
            <div style={{ fontSize:12, color:M, marginTop:2 }}>{user?.email||""}</div>
            <div style={{ marginTop:4 }}><Tag>{user?.is_premium?"PRO":"FREE"}</Tag></div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          {[{v:stats.total_workouts,l:"Workouts"},{v:stats.streak,l:"Streak"},{v:stats.total_plans,l:"Plans"}].map((x,i)=>(
            <div key={i} style={{ flex:1, ...card, textAlign:"center", padding:"12px 6px" }}>
              <div style={{ fontSize:20, fontWeight:800, color:W }}>{x.v}</div>
              <div style={{ fontSize:10, color:M, marginTop:3 }}>{x.l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:16 }}>
          {menu.map((m,i)=>(
            <button key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 2px", background:"none", border:"none", borderBottom:"1px solid "+BD, cursor:"pointer", width:"100%", fontFamily:"inherit" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:16 }}>{m.e}</span>
                <span style={{ fontSize:14, fontWeight:500, color:W }}>{m.l}</span>
              </div>
              <Chev />
            </button>
          ))}
        </div>
        <button style={{ ...ctaO, marginTop:20, marginBottom:8, borderColor:"#FF4444", color:"#FF4444" }} onClick={onLogout}>Log Out</button>
      </div>
      <Nav act="profile" go={go} />
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,  setScreen]  = useState("welcome");
  const [plan,    setPlan]    = useState(null);
  const [step,    setStep]    = useState(0);
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(()=>localStorage.getItem("kyroo_token"));
  const [plans,   setPlans]   = useState(PLANS_FALLBACK);
  const [answers, setAnswers] = useState({});
  const ref = useRef(null);

  // Auto-scroll to top on screen change
  useEffect(()=>{ if(ref.current) ref.current.scrollTop=0; }, [screen, step]);

  // Load plans from API
  useEffect(()=>{
    api.plans.list()
      .then(data=>{ if(data?.length) setPlans(data.map(p=>({...p, cat:p.category, desc:p.description}))); })
      .catch(()=>{});
  }, []);

  // Restore session on load
  useEffect(()=>{
    if (!token) return;
    api.profile.get()
      .then(profile=>{ setUser(profile); setScreen("home"); })
      .catch(()=>{ localStorage.removeItem("kyroo_token"); setToken(null); });
  }, []);

  const onLogin = (newToken, newUser) => {
    localStorage.setItem("kyroo_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const onLogout = () => {
    localStorage.removeItem("kyroo_token");
    setToken(null);
    setUser(null);
    setScreen("welcome");
  };

  const go = s => setScreen(s);

  const onAnswersComplete = (key, value, isDone) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const renderScreen = () => {
    switch (screen) {
      case "welcome":    return <Welcome go={go} />;
      case "login":      return <Login go={go} onLogin={onLogin} />;
      case "register":   return <Register go={go} onLogin={onLogin} />;
      case "reset":      return <Reset go={go} />;
      case "resetsent":  return <ResetSent go={go} />;
      case "home":       return <Home go={go} sp={setPlan} user={user} plans={plans} />;
      case "plans":      return <Plans go={go} sp={setPlan} plans={plans} />;
      case "detail":     return <Detail go={go} plan={plan} ss={setStep} />;
      case "form":       return <Form go={go} step={step} ss={setStep} plan={plan} onAnswersComplete={onAnswersComplete} />;
      case "generating": return <Generating go={go} plan={plan} answers={answers} />;
      case "program":    return <Program go={go} />;
      case "profile":    return <Profile go={go} user={user} onLogout={onLogout} />;
      case "tracking":   return <Tracking go={go} />;
      default:           return <Welcome go={go} />;
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", gap:32, padding:"24px 16px", fontFamily:"-apple-system,'Helvetica Neue',sans-serif", flexWrap:"wrap", justifyContent:"center", alignItems:"flex-start" }}>
      {/* Phone frame */}
      <div>
        <div style={{ width:375, height:812, background:BG, borderRadius:40, overflow:"hidden", boxShadow:"0 25px 80px rgba(0,0,0,0.6),0 0 0 2px #333", display:"flex", flexDirection:"column" }}>
          <SBar />
          <div ref={ref} style={{ flex:1, overflowY:"auto", overflowX:"hidden", display:"flex", flexDirection:"column" }}>
            {renderScreen()}
          </div>
        </div>
      </div>

      {/* Screen navigator (dev helper) */}
      <div style={{ width:200, paddingTop:24 }}>
        <div style={{ fontSize:16, fontWeight:800, letterSpacing:-0.5, color:W }}>KYROO</div>
        <div style={{ fontSize:11, color:M, marginBottom:20 }}>Navigator</div>
        {[
          { label:"AUTH FLOW",    ids:["welcome","login","register","reset","resetsent"] },
          { label:"MAIN APP",     ids:["home","plans","detail"] },
          { label:"PLAN BUILDER", ids:["form","generating","program"] },
          { label:"USER",         ids:["tracking","profile"] },
        ].map((g,gi)=>(
          <div key={gi} style={{ marginBottom:16 }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:2, color:A, marginBottom:6 }}>{g.label}</div>
            {g.ids.map(sid=>{
              const isAct = screen===sid;
              const labels = { welcome:"Welcome", login:"Login", register:"Register", reset:"Password Reset", resetsent:"Email Sent", home:"Home", plans:"Plans Catalog", detail:"Plan Detail", form:"Questionnaire", generating:"Generating…", program:"My Program", profile:"Profile", tracking:"Tracking" };
              return (
                <button key={sid} onClick={()=>{ go(sid); if(sid==="form")setStep(0); if(sid==="detail"&&!plan)setPlan(plans[1]); }} style={{ display:"block", width:"100%", padding:"6px 10px", borderRadius:6, fontSize:12, fontWeight:isAct?700:400, textAlign:"left", background:isAct?A+"20":"transparent", color:isAct?A:"#aaa", border:"none", cursor:"pointer", fontFamily:"inherit", marginBottom:2 }}>
                  {labels[sid]}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
