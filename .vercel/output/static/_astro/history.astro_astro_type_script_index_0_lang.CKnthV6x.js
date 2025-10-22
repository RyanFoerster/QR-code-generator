let l=[],i=[],d=1;const y=10,v=document.getElementById("history-list"),I=document.getElementById("empty-state"),S=document.getElementById("total-count"),k=document.getElementById("total-amount"),L=document.getElementById("monthly-count"),H=document.getElementById("search-input"),B=document.getElementById("amount-filter"),C=document.getElementById("date-filter"),F=document.getElementById("clear-all-history"),O=document.getElementById("export-history"),T=document.getElementById("import-history"),D=document.getElementById("import-file-input"),Q=document.getElementById("refresh-history"),b=document.getElementById("pagination"),w=document.getElementById("prev-page"),E=document.getElementById("next-page"),R=document.getElementById("page-info");document.addEventListener("DOMContentLoaded",()=>{p(),A()});function p(){try{const t=localStorage.getItem("qr-payment-history");l=t?JSON.parse(t):[],l.sort((e,o)=>new Date(o.date).getTime()-new Date(e.date).getTime()),i=[...l],N(),h(),f()}catch(t){console.error("Erreur lors du chargement de l'historique:",t),l=[],i=[]}}function A(){H?.addEventListener("input",()=>{x()}),B?.addEventListener("change",()=>{x()}),C?.addEventListener("change",()=>{x()}),F?.addEventListener("click",()=>{confirm("Êtes-vous sûr de vouloir vider tout l'historique ? Cette action est irréversible.")&&(localStorage.removeItem("qr-payment-history"),p())}),O?.addEventListener("click",()=>{P()}),T?.addEventListener("click",()=>{D?.click()}),D?.addEventListener("change",t=>{const e=t.target.files?.[0];e&&U(e)}),Q?.addEventListener("click",()=>{p()}),w?.addEventListener("click",()=>{d>1&&(d--,h(),f())}),E?.addEventListener("click",()=>{const t=Math.ceil(i.length/y);d<t&&(d++,h(),f())})}function x(){const t=H?.value.toLowerCase()||"",e=B?.value||"",o=C?.value||"";i=l.filter(n=>{const a=!t||n.iban.toLowerCase().includes(t)||n.amount.includes(t)||n.communication.toLowerCase().includes(t)||n.beneficiary.toLowerCase().includes(t),s=parseFloat(n.amount);let r=!0;if(e)switch(e){case"0-50":r=s>=0&&s<=50;break;case"50-100":r=s>50&&s<=100;break;case"100-500":r=s>100&&s<=500;break;case"500+":r=s>500;break}let c=!0;if(o){const m=new Date(n.date),u=new Date;switch(o){case"today":c=m.toDateString()===u.toDateString();break;case"week":const g=new Date(u.getTime()-10080*60*1e3);c=m>=g;break;case"month":const $=new Date(u.getTime()-720*60*60*1e3);c=m>=$;break;case"year":const q=new Date(u.getTime()-365*24*60*60*1e3);c=m>=q;break}}return a&&r&&c}),d=1,h(),f()}function h(){if(!v)return;if(i.length===0){v.innerHTML="",I?.classList.remove("hidden");return}I?.classList.add("hidden");const t=(d-1)*y,e=t+y,o=i.slice(t,e);v.innerHTML=o.map((n,a)=>`
      <div class="p-6 hover:bg-gray-700/30 transition-colors group">
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
          <!-- QR Code -->
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
              <span class="text-xl">📱</span>
            </div>
            <div class="flex flex-col gap-1">
              <button 
                onclick="regenerateQR(${t+a})"
                class="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                🔄 Régénérer
              </button>
              <button 
                onclick="downloadQR(${t+a})"
                class="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                📥 Télécharger
              </button>
            </div>
          </div>
          
          <!-- IBAN -->
          <div class="font-mono text-sm text-gray-300 break-all">
            ${n.iban}
          </div>
          
          <!-- Montant -->
          <div class="text-lg font-bold text-green-400">
            ${n.amount}€
          </div>
          
          <!-- Communication -->
          <div class="text-sm text-gray-300 break-words">
            ${n.communication||"-"}
          </div>
          
          <!-- Bénéficiaire -->
          <div class="text-sm text-gray-300 break-words">
            ${n.beneficiary||"-"}
          </div>
          
          <!-- Date -->
          <div class="text-sm text-gray-400">
            ${new Date(n.date).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}
          </div>
        </div>
        
        <!-- Actions -->
        <div class="mt-4 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onclick="useQR(${t+a})"
            class="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            📋 Utiliser
          </button>
          <button 
            onclick="duplicateQR(${t+a})"
            class="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
          >
            📋 Dupliquer
          </button>
          <button 
            onclick="deleteQR(${t+a})"
            class="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
          >
            🗑️ Supprimer
          </button>
        </div>
      </div>
    `).join("")}function N(){if(S&&(S.textContent=l.length.toString()),k){const t=l.reduce((e,o)=>e+parseFloat(o.amount||0),0);k.textContent=`${t.toFixed(2)}€`}if(L){const t=new Date,e=l.filter(o=>{const n=new Date(o.date);return n.getMonth()===t.getMonth()&&n.getFullYear()===t.getFullYear()}).length;L.textContent=e.toString()}}function f(){if(!b)return;const t=Math.ceil(i.length/y);if(t<=1){b.classList.add("hidden");return}b.classList.remove("hidden"),w&&(w.disabled=d===1),E&&(E.disabled=d===t),R&&(R.textContent=`Page ${d} sur ${t}`)}function P(){try{const t=JSON.stringify(l,null,2),e=new Blob([t],{type:"application/json"}),o=URL.createObjectURL(e),n=document.createElement("a");n.href=o,n.download=`qr-history-${new Date().toISOString().slice(0,10)}.json`,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(o)}catch(t){console.error("Erreur lors de l'export:",t),alert("Erreur lors de l'export de l'historique")}}function U(t){const e=new FileReader;e.onload=o=>{try{const n=JSON.parse(o.target?.result);if(Array.isArray(n)){const r=[...JSON.parse(localStorage.getItem("qr-payment-history")||"[]"),...n].filter((c,m,u)=>m===u.findIndex(g=>g.iban===c.iban&&g.amount===c.amount&&g.communication===c.communication&&g.date===c.date));localStorage.setItem("qr-payment-history",JSON.stringify(r)),p(),alert("Historique importé avec succès !")}else alert("Format de fichier invalide")}catch(n){console.error("Erreur lors de l'import:",n),alert("Erreur lors de l'import de l'historique")}},e.readAsText(t)}window.useQR=t=>{const e=i[t];if(e){const o=new URLSearchParams({iban:e.iban,amount:e.amount,communication:e.communication||"",beneficiary:e.beneficiary||""});window.location.href=`/?${o.toString()}`}};window.duplicateQR=t=>{const e=i[t];if(e){const o={...e,date:new Date().toISOString()},n=JSON.parse(localStorage.getItem("qr-payment-history")||"[]");n.unshift(o),localStorage.setItem("qr-payment-history",JSON.stringify(n)),p()}};window.deleteQR=t=>{const e=i[t];if(e&&confirm("Êtes-vous sûr de vouloir supprimer ce QR code ?")){const n=JSON.parse(localStorage.getItem("qr-payment-history")||"[]").filter(a=>a!==e);localStorage.setItem("qr-payment-history",JSON.stringify(n)),p()}};window.regenerateQR=t=>{i[t]&&useQR(t)};window.downloadQR=t=>{const e=i[t];if(e){const o=e.iban.replace(/\s/g,""),n=`BCD
002
1
SCT

${e.beneficiary||""}
${o}
EUR${e.amount}


${e.communication||""}`,s=`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(n)}&format=png&margin=10`,r=document.createElement("a");r.href=s,r.download=`qr-${e.amount}EUR-${new Date().toISOString().slice(0,10)}.png`,document.body.appendChild(r),r.click(),document.body.removeChild(r)}};
