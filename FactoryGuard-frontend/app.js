const initialMachines = [
 {id:"M-001",name:"CNC Mill #01",line:"Line A",status:"Healthy",temp:42.6,vibration:2.1,uptime:99.2,checked:"Just now",type:"CNC machine",efficiency:96},
 {id:"M-002",name:"CNC Mill #02",line:"Line A",status:"Warning",temp:51.8,vibration:5.8,uptime:96.4,checked:"2 min ago",type:"CNC machine",efficiency:84},
 {id:"M-003",name:"Hydraulic Press #04",line:"Line B",status:"Critical",temp:78.3,vibration:4.4,uptime:91.8,checked:"1 min ago",type:"Hydraulic press",efficiency:72},
 {id:"M-004",name:"Conveyor Belt #02",line:"Line B",status:"Healthy",temp:38.1,vibration:1.7,uptime:99.7,checked:"Just now",type:"Conveyor",efficiency:94},
 {id:"M-005",name:"Packaging Unit #01",line:"Line C",status:"Healthy",temp:40.2,vibration:2.3,uptime:98.9,checked:"3 min ago",type:"Packaging",efficiency:93},
 {id:"M-006",name:"Cooling Pump #03",line:"Line C",status:"Offline",temp:0,vibration:0,uptime:87.1,checked:"18 min ago",type:"Pump",efficiency:0},
 {id:"M-007",name:"CNC Mill #03",line:"Line A",status:"Healthy",temp:43.1,vibration:2.4,uptime:98.8,checked:"1 min ago",type:"CNC machine",efficiency:95},
 {id:"M-008",name:"Assembly Robot #02",line:"Line B",status:"Healthy",temp:46.5,vibration:2.0,uptime:99.4,checked:"Just now",type:"Robot",efficiency:97},
 {id:"M-009",name:"Air Compressor #01",line:"Line C",status:"Warning",temp:59.4,vibration:4.9,uptime:95.2,checked:"4 min ago",type:"Compressor",efficiency:81},
 {id:"M-010",name:"Packaging Unit #02",line:"Line C",status:"Healthy",temp:39.8,vibration:1.9,uptime:99.1,checked:"2 min ago",type:"Packaging",efficiency:92},
 {id:"M-011",name:"Conveyor Belt #04",line:"Line B",status:"Healthy",temp:37.6,vibration:1.6,uptime:99.8,checked:"Just now",type:"Conveyor",efficiency:96},
 {id:"M-012",name:"Hydraulic Press #02",line:"Line A",status:"Healthy",temp:48.2,vibration:2.8,uptime:98.1,checked:"5 min ago",type:"Hydraulic press",efficiency:90}
];
const initialAlerts = [
 {id:101,severity:"Critical",title:"High temperature detected",description:"Temperature exceeded the demo threshold of 75°C.",machineId:"M-003",time:"10:42 AM",state:"Open"},
 {id:102,severity:"Warning",title:"Vibration above baseline",description:"Vibration reading is higher than its normal sample range.",machineId:"M-002",time:"10:35 AM",state:"Open"},
 {id:103,severity:"Warning",title:"Temperature trending upward",description:"Compressor temperature is approaching the sample warning level.",machineId:"M-009",time:"10:18 AM",state:"Open"},
 {id:104,severity:"Info",title:"Maintenance completed",description:"Routine inspection recorded for Conveyor Belt #02.",machineId:"M-004",time:"09:50 AM",state:"Acknowledged"},
 {id:105,severity:"Warning",title:"Machine connection lost",description:"No recent demo heartbeat received from Cooling Pump #03.",machineId:"M-006",time:"09:27 AM",state:"Acknowledged"},
 {id:106,severity:"Info",title:"Machine back within range",description:"CNC Mill #01 readings are within the sample range.",machineId:"M-001",time:"Yesterday",state:"Resolved"}
];
const API_BASE_URL = window.FACTORYGUARD_API_URL || "http://localhost:8000";
const API_TIMEOUT_MS = 5000;
let machines = structuredClone(initialMachines);
let alerts = structuredClone(initialAlerts);
let currentPage = "overview";
let currentContact = "Morgan Lee";
let toastTimer;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const machineById = id => machines.find(m=>m.id===id);
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function fetchApiList(path,key){
 const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),API_TIMEOUT_MS);
 try{
  const response=await fetch(`${API_BASE_URL}${path}`,{signal:controller.signal});
  if(!response.ok)throw new Error(`GET ${path} returned ${response.status}`);
  const payload=await response.json(), rows=Array.isArray(payload)?payload:payload?.[key];
  if(!Array.isArray(rows))throw new Error(`GET ${path} did not return a ${key} array`);
  return rows;
 }finally{clearTimeout(timeout)}
}
function normalizeMachine(record){
 if(!record||typeof record!=="object")throw new Error("Invalid machine record");
 const id=record.id??record.machine_id, name=record.name??record.machine_name;
 const temperature=Number(record.temp??record.temperature??record.metrics?.temperature);
 const vibration=Number(record.vibration??record.metrics?.vibration);
 if(id==null||!name||!record.status||!Number.isFinite(temperature)||!Number.isFinite(vibration))throw new Error("Machine records require id, name, status, temperature, and vibration");
 const sample=initialMachines.find(machine=>machine.id===String(id));
 return {...sample,...record,id:String(id),name:String(name),status:String(record.status),temp:temperature,vibration,line:record.line??sample?.line??"Unassigned",uptime:Number(record.uptime??sample?.uptime??0),checked:record.checked??record.last_checked??"Just now",type:record.type??sample?.type??"Machine",efficiency:Number(record.efficiency??sample?.efficiency??0)};
}
function normalizeAlert(record){
 if(!record||typeof record!=="object")throw new Error("Invalid alert record");
 const id=Number(record.id??record.alert_id), machineId=record.machineId??record.machine_id;
 const severity=record.severity, title=record.title;
 if(!Number.isFinite(id)||machineId==null||!severity||!title)throw new Error("Alert records require numeric id, machineId, severity, and title");
 return {...record,id,severity:String(severity),title:String(title),description:String(record.description??record.message??""),machineId:String(machineId),time:String(record.time??record.created_at??"Just now"),state:String(record.state??"Open")};
}
async function loadLiveData(){
 try{machines=(await fetchApiList("/machines","machines")).map(normalizeMachine)}
 catch(error){machines=structuredClone(initialMachines);console.warn("Machine API unavailable; using demo data.",error)}
 try{alerts=(await fetchApiList("/alerts","alerts")).map(normalizeAlert)}
 catch(error){alerts=structuredClone(initialAlerts);console.warn("Alert API unavailable; using demo data.",error)}
 renderAll();
}
function showToast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2600)}
function goTo(page){currentPage=page;$$(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));$$(".nav-link[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("#breadcrumbCurrent").textContent=({overview:"Overview",machines:"Machines",alerts:"Alerts",analytics:"Analytics",technician:"Technician chat",settings:"Settings"})[page]||"Overview";$("#sidebar").classList.remove("open");renderAll();window.scrollTo({top:0,behavior:"smooth"})}
$$(".nav-link[data-page]").forEach(b=>b.addEventListener("click",()=>goTo(b.dataset.page)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>goTo(b.dataset.go)));
$("#menuToggle").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#topAlerts").addEventListener("click",()=>goTo("alerts"));
function statusClass(s){return `status ${s}`}
function machineIcon(m){return m.type==="CNC machine"?"⚙":m.type==="Hydraulic press"?"▤":m.type==="Conveyor"?"⇢":m.type==="Robot"?"♙":m.type==="Pump"?"◉":"▦"}
function renderOverview(){
 const visible=machines.slice(0,5);
 $("#overviewMachineRows").innerHTML=visible.map(m=>`<tr><td><div class="machine-name"><span class="machine-icon">${machineIcon(m)}</span><span><strong>${esc(m.name)}</strong><small>${m.id}</small></span></div></td><td>${m.line}</td><td><span class="${statusClass(m.status)}">${m.status}</span></td><td>${m.temp?m.temp.toFixed(1)+" °C":"—"}</td><td>${m.vibration?m.vibration.toFixed(1)+" mm/s":"—"}</td><td>${m.checked}</td><td><button class="row-action" data-machine="${m.id}" aria-label="View machine">⋯</button></td></tr>`).join("");
 const recent=alerts.filter(a=>a.state!=="Resolved").slice(0,4);
 $("#recentAlerts").innerHTML=recent.map(a=>`<div class="alert-item"><div class="alert-symbol severity-${a.severity.toLowerCase()}">${a.severity==="Critical"?"!":a.severity==="Warning"?"⚑":"i"}</div><div class="alert-info"><strong>${esc(a.title)}</strong><p>${esc(a.description)}</p><small>${esc(machineById(a.machineId)?.name||a.machineId)} · ${a.time}</small></div></div>`).join("")||'<p class="muted">No active alerts. Nice work!</p>';
 $("#activeAlertStat").innerHTML=`${alerts.filter(a=>a.state==="Open").length} <small class="trend negative">Needs attention</small>`;
 $(".alert-count").textContent=alerts.filter(a=>a.state==="Open").length;
 drawPerformanceChart();
}
function renderMachines(){
 const query=($("#machineSearch")?.value||"").toLowerCase(), st=$("#machineStatusFilter")?.value||"all", line=$("#machineLineFilter")?.value||"all";
 const filtered=machines.filter(m=>(m.name+" "+m.id).toLowerCase().includes(query)&&(st==="all"||m.status===st)&&(line==="all"||m.line===line));
 $("#machineCards").innerHTML=filtered.map(m=>`<article class="machine-card" data-machine="${m.id}"><div class="machine-card-head"><div class="machine-card-title"><span class="machine-icon">${machineIcon(m)}</span><span><strong>${esc(m.name)}</strong><small>${m.id} · ${m.line}</small></span></div><span class="${statusClass(m.status)}">${m.status}</span></div><div class="machine-card-reading"><div><div class="reading-label">Temperature</div><div class="reading-value">${m.temp?m.temp.toFixed(1)+"°":"—"}</div></div><div><div class="reading-label">Vibration</div><div class="reading-value">${m.vibration?m.vibration.toFixed(1):"—"} <small style="font:10px 'DM Sans';color:#9aa4b3">mm/s</small></div></div></div><div class="machine-card-foot"><span>Uptime ${m.uptime}%</span><span>Checked ${m.checked}</span></div></article>`).join("")||'<div class="panel"><p class="muted">No machines match those filters.</p></div>';
}
function renderAlerts(){
 const q=($("#alertSearch")?.value||"").toLowerCase(), sev=$("#alertSeverityFilter")?.value||"all", state=$("#alertStateFilter")?.value||"all";
 const filtered=alerts.filter(a=>{const m=machineById(a.machineId);return (a.title+" "+a.description+" "+(m?.name||"")).toLowerCase().includes(q)&&(sev==="all"||a.severity===sev)&&(state==="all"||a.state===state)});
 $("#alertRows").innerHTML=filtered.map(a=>`<tr><td><span class="status ${a.severity==="Critical"?"Critical":a.severity==="Warning"?"Warning":"Healthy"}">${a.severity}</span></td><td><strong>${esc(a.title)}</strong><div style="font-size:10px;color:#9aa4b3;margin-top:4px">${esc(a.description)}</div></td><td>${esc(machineById(a.machineId)?.name||a.machineId)}</td><td>${a.time}</td><td><span class="alert-state ${a.state}">${a.state}</span></td><td>${a.state==="Open"?`<button class="small-action" data-ack="${a.id}">Acknowledge</button>`:a.state==="Acknowledged"?`<button class="small-action" data-resolve="${a.id}">Resolve</button>`:'—'}</td></tr>`).join("")||'<tr><td colspan="6" style="padding:30px;text-align:center;color:#9aa4b3">No alerts match your filters.</td></tr>';
 $("#unresolvedCount").textContent=alerts.filter(a=>a.state==="Open").length;$("#criticalCount").textContent=alerts.filter(a=>a.severity==="Critical"&&a.state!=="Resolved").length;$("#ackCount").textContent=alerts.filter(a=>a.state==="Acknowledged").length;$(".alert-count").textContent=alerts.filter(a=>a.state==="Open").length;
}
function drawPerformanceChart(){
 const el=$("#performanceChart");if(!el)return;
 const labels=["10","11","12","13","14","15","16"], a=[74,78,76,84,80,89,92], b=[91,93,92,94,93,96,98];
 const points=arr=>arr.map((v,i)=>`${28+i* (el.clientWidth-50)/6},${160-(v-65)*4}`).join(" ");
 const w=Math.max(el.clientWidth,400);
 const mkPoints=arr=>arr.map((v,i)=>`${25+i*(w-50)/6},${165-(v-65)*3.4}`).join(" ");
 let grid="";[75,85,95].forEach(v=>{const y=165-(v-65)*3.4;grid+=`<line x1="25" y1="${y}" x2="${w-15}" y2="${y}" stroke="#edf0f5" stroke-dasharray="3 4"/><text x="0" y="${y+3}" fill="#a1aab8" font-size="9">${v}%</text>`});
 const dots=arr=>arr.map((v,i)=>`<circle cx="${25+i*(w-50)/6}" cy="${165-(v-65)*3.4}" r="3.5" fill="white" stroke="${arr===a?"#4777ef":"#25b88a"}" stroke-width="2"/>`).join("");
 el.innerHTML=`<svg viewBox="0 0 ${w} 190" preserveAspectRatio="none">${grid}<polyline points="${mkPoints(a)}" fill="none" stroke="#4777ef" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/> <polyline points="${mkPoints(b)}" fill="none" stroke="#25b88a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${dots(a)}${dots(b)}</svg>`;
}
function renderAnalytics(){
 const data=machines.filter(m=>m.status!=="Offline").slice(0,7);
 $("#efficiencyChart").innerHTML=data.map(m=>`<div class="bar-row"><span>${esc(m.name.replace(" #"," #"))}</span><div class="bar-track"><div class="bar-fill" style="width:${m.efficiency}%"></div></div><span class="bar-value">${m.efficiency}%</span></div>`).join("");
 const items=[["Critical",alerts.filter(a=>a.severity==="Critical").length,"#d94b4b"],["Warning",alerts.filter(a=>a.severity==="Warning").length,"#db8a25"],["Info",alerts.filter(a=>a.severity==="Info").length,"#4777ef"]];
 $("#distributionChart").innerHTML=items.map(i=>`<div class="distribution-row"><i class="distribution-dot" style="background:${i[2]}"></i><span>${i[0]} alerts</span><strong>${i[1]}</strong></div>`).join("");
}
function renderAll(){renderOverview();renderMachines();renderAlerts();renderAnalytics()}
function openMachine(id){
 const m=machineById(id);if(!m)return;
 $("#modalContent").innerHTML=`<p class="eyebrow">${m.id} · ${m.line}</p><h2 id="modalTitle">${esc(m.name)}</h2><p class="modal-sub">${esc(m.type)} · <span class="${statusClass(m.status)}">${m.status}</span></p><div class="modal-readings"><div class="modal-reading"><span>Temperature</span><strong>${m.temp?m.temp.toFixed(1)+" °C":"Offline"}</strong></div><div class="modal-reading"><span>Vibration</span><strong>${m.vibration?m.vibration.toFixed(1)+" mm/s":"—"}</strong></div><div class="modal-reading"><span>Uptime</span><strong>${m.uptime}%</strong></div><div class="modal-reading"><span>Output efficiency</span><strong>${m.efficiency}%</strong></div></div><div class="modal-section"><h3>Machine details</h3><p>Production line: <strong>${m.line}</strong><br>Last sample check: <strong>${m.checked}</strong><br>Data source: <strong>Local demo data</strong></p><p>${m.status==="Critical"?"Recommended: inspect this machine and verify its readings.":m.status==="Warning"?"Recommended: review recent sensor readings and schedule an inspection if needed.":m.status==="Offline"?"Recommended: check machine power and connectivity.":"Current sample readings are within the configured demo range."}</p></div><div class="modal-actions"><button class="btn btn-primary" id="machineAlertAction">View related alerts</button><button class="btn btn-light" id="closeMachine">Close</button></div>`;
 $("#modalBackdrop").classList.add("show");$("#machineAlertAction").onclick=()=>{closeModal();$("#alertSearch").value=m.name;goTo("alerts")};$("#closeMachine").onclick=closeModal;
}
function closeModal(){$("#modalBackdrop").classList.remove("show")}
$("#modalClose").addEventListener("click",closeModal);$("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal()});document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
document.addEventListener("click",e=>{const machine=e.target.closest("[data-machine]");if(machine)openMachine(machine.dataset.machine);const ack=e.target.closest("[data-ack]");if(ack){const a=alerts.find(x=>x.id===Number(ack.dataset.ack));if(a)a.state="Acknowledged";renderAll();showToast("Alert acknowledged")};const res=e.target.closest("[data-resolve]");if(res){const a=alerts.find(x=>x.id===Number(res.dataset.resolve));if(a)a.state="Resolved";renderAll();showToast("Alert marked as resolved")}});
["machineSearch","machineStatusFilter","machineLineFilter"].forEach(id=>$("#"+id).addEventListener("input",renderMachines));
["alertSearch","alertSeverityFilter","alertStateFilter"].forEach(id=>$("#"+id).addEventListener("input",renderAlerts));
$("#clearResolved").addEventListener("click",()=>{alerts=alerts.filter(a=>a.state!=="Resolved");renderAll();showToast("Resolved alerts removed from this view")});
$("#addMachineBtn").addEventListener("click",()=>{const name=prompt("Enter a name for the demo machine:");if(!name||!name.trim())return;const id="M-"+String(Math.max(12,...machines.map(m=>Number(m.id.split("-")[1])||0))+1).padStart(3,"0");machines.push({id,name:name.trim(),line:"Line A",status:"Healthy",temp:40+Math.random()*8,vibration:1.5+Math.random(),uptime:100,checked:"Just now",type:"Custom machine",efficiency:90});renderAll();showToast("Demo machine added")});
$("#performanceRange").addEventListener("change",()=>{showToast("Chart range updated (sample visualization)");drawPerformanceChart()});
function downloadCsv(filename,rows){const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href);showToast("Report exported as CSV")}
$("#exportOverview").addEventListener("click",()=>downloadCsv("factoryguard-machines.csv",[["ID","Machine","Line","Status","Temperature C","Vibration mm/s","Uptime %"],...machines.map(m=>[m.id,m.name,m.line,m.status,m.temp,m.vibration,m.uptime])]));
$("#exportAnalytics").addEventListener("click",()=>downloadCsv("factoryguard-analytics.csv",[["Machine","Status","Efficiency","Uptime"],...machines.map(m=>[m.name,m.status,m.efficiency,m.uptime])]));
const contactRoles={"Morgan Lee":"Maintenance technician","Priya Patel":"Controls engineer","Jordan Kim":"Shift supervisor"};
const contactMessages={"Morgan Lee":[["received","Morning! I’m checking the Line A machines. Let me know if anything needs a closer look.","09:12 AM"],["sent","Could you inspect Hydraulic Press #04? Its temperature alert came up.","09:18 AM"],["received","Sure, I’ll inspect the cooling system and report back here.","09:20 AM"]],"Priya Patel":[["received","Hi! I’m monitoring the controls systems today. What can I help with?","09:05 AM"]],"Jordan Kim":[["received","Shift handover is complete. Let me know if you need an operational update.","08:55 AM"]]};
function renderMessages(){const msgs=contactMessages[currentContact]||[];$("#messages").innerHTML='<div class="date-divider">TODAY</div>'+msgs.map(m=>`<div class="message ${m[0]}"><p>${esc(m[1])}</p><small>${m[2]}</small></div>`).join("");$("#messages").scrollTop=$("#messages").scrollHeight}
$$(".contact[data-contact]").forEach(btn=>btn.addEventListener("click",()=>{currentContact=btn.dataset.contact;$$(".contact").forEach(c=>c.classList.toggle("active",c===btn));$("#chatName").textContent=currentContact;$("#chatRole").textContent=contactRoles[currentContact]+" · Available";$("#chatAvatar").textContent=currentContact.split(" ").map(x=>x[0]).join("");$("#chatAvatar").className="contact-avatar "+(currentContact==="Morgan Lee"?"teal":currentContact==="Priya Patel"?"purple":"amber");renderMessages()}));
$("#contactSearch").addEventListener("input",e=>$$(".contact").forEach(c=>c.style.display=c.dataset.contact.toLowerCase().includes(e.target.value.toLowerCase())?"flex":"none"));
$("#chatForm").addEventListener("submit",e=>{e.preventDefault();const input=$("#chatInput"),message=input.value.trim();if(!message)return;if(!contactMessages[currentContact])contactMessages[currentContact]=[];const now=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});contactMessages[currentContact].push(["sent",message,now]);input.value="";renderMessages();showToast("Demo message added")});
$("#saveSettings").addEventListener("click",()=>{$("#settingsMessage").textContent=`Settings saved locally for ${$("#facilityName").value||"your workspace"}.`;showToast("Settings saved in this page")});
$("#resetDemo").addEventListener("click",()=>{if(!confirm("Restore the original sample machines and alerts?"))return;machines=structuredClone(initialMachines);alerts=structuredClone(initialAlerts);renderAll();$("#settingsMessage").textContent="Original demo data restored.";showToast("Demo data reset")});
$("#units").addEventListener("change",e=>{const imperial=e.target.value==="imperial";showToast(imperial?"Imperial selected in settings. Sensor cards currently display °C sample values.":"Metric selected.")});
window.addEventListener("resize",()=>{if(currentPage==="overview")drawPerformanceChart()});
renderAll();
loadLiveData();
