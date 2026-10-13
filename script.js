const $ = id => document.getElementById(id);

const today = new Date();
$("billDate").value = today.toISOString().slice(0,10);
$("billTime").value = today.toTimeString().slice(0,5);

let items = [
  {name:"Coffee", price:200, qty:2}
];
let taxes = [
  {name:"CGST", rate:5, enabled:true},
  {name:"SGST", rate:5, enabled:true}
];

function money(n){
  const symbol = $("currencyRemove").checked ? "" : ($("currency").value || "₹");
  const prefix = $("currency").value === "₹" && $("currencyRemove").checked ? "₹ " : symbol + " ";
  return `${prefix}${Number(n).toFixed(2)}`;
}

function renderItemsEditor(){
  $("items").innerHTML = items.map((item,i)=>`
    <div class="item-row">
      <label>Item Name<input data-item="${i}" data-key="name" value="${escapeHtml(item.name)}"></label>
      <label>Item Price<input type="number" min="0" data-item="${i}" data-key="price" value="${item.price}"></label>
      <label>Quantity<input type="number" min="1" data-item="${i}" data-key="qty" value="${item.qty}"></label>
      <button class="remove-item" data-index="${i}" title="Remove">×</button>
    </div>`).join("");

  $("items").querySelectorAll("input").forEach(inp=>{
    inp.addEventListener("input", e=>{
      const i=+e.target.dataset.item, key=e.target.dataset.key;
      items[i][key] = key==="name" ? e.target.value : Number(e.target.value)||0;
      updatePreview();
    });
  });
  $("items").querySelectorAll(".remove-item").forEach(btn=>{
    btn.addEventListener("click",()=>{items.splice(+btn.dataset.index,1);renderItemsEditor();updatePreview();});
  });
}

function renderTaxes(){
  $("taxes").innerHTML = taxes.map((t,i)=>`
    <div class="grid-2 tax-editor">
      <label>Field Name<input data-tax="${i}" data-key="name" value="${escapeHtml(t.name)}"></label>
      <label>Tax<input type="number" min="0" data-tax="${i}" data-key="rate" value="${t.rate}"></label>
    </div>`).join("");
  $("taxes").querySelectorAll("input").forEach(inp=>{
    inp.addEventListener("input",()=>{
      const i=+inp.dataset.tax,key=inp.dataset.key;
      taxes[i][key]=key==="name"?inp.value:Number(inp.value)||0;
      updatePreview();
    });
  });
}

function escapeHtml(v){
  return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

function formatDate(v){
  if(!v)return "";
  const d=new Date(v+"T00:00:00");
  return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
}

function updatePreview(){
  $("rName").textContent=$("restaurantName").value;
  $("rAddress").textContent=$("restaurantAddress").value;
  $("rCare").textContent=$("careNumber").value;
  $("rInvoice").textContent=$("invoiceNumber").value;
  $("rTable").textContent=$("tableNo").value;
  $("rDate").textContent=formatDate($("billDate").value);
  $("rTime").textContent=$("billTime").value;
  $("rPayment").textContent=$("paymentMethod").value;



// GST No. Remove functionality
const gstRemoved = $("gstRemove").checked;


// Hide/show GST details on receipt
if ($("rGstInfo")) {
    $("rGstInfo").style.display = gstRemoved ? "none" : "block";
}

// Update GST field values
if ($("rGstName")) {
    $("rGstName").textContent = $("gstName").value;
    $("rGstValue").textContent = $("gstValue").value;
    $("rFssaiName").textContent = $("fssaiName").value;
    $("rFssaiValue").textContent = $("fssaiValue").value;
}




  $("rOptional").style.display=$("optionalRemove").checked?"none":"block";
  $("rOptional").textContent=`${$("optionalName").value}: ${$("optionalValue").value}`;

  $("taxRows").innerHTML="";
  $("receiptItems").innerHTML="";
  let subtotal=0;
  items.forEach(item=>{
    const amount=(Number(item.price)||0)*(Number(item.qty)||0);
    subtotal+=amount;
    $("receiptItems").insertAdjacentHTML("beforeend",
      `<tr><td>${escapeHtml(item.qty)} ${escapeHtml(item.name)}</td><td>${money(item.price)}</td><td>${money(amount)}</td></tr>`);
  });

  let taxTotal=0;
  if(!$("taxRemove").checked){
    taxes.forEach(t=>{
      if(!t.enabled)return;
      const amount=subtotal*(Number(t.rate)||0)/100;
      taxTotal+=amount;
      $("taxRows").insertAdjacentHTML("beforeend",
	  
        `<div class="tax-row"><span>${escapeHtml(t.name)}: ${t.rate}%</span><span>${money(amount)}</span></div>`);
    });
  }
  $("rSubtotal").textContent=money(subtotal);
  $("rTotal").textContent=money(subtotal+taxTotal);

  const removeLogo=$("logoRemove").checked;
  $("defaultLogo").style.display=removeLogo?"none":"flex";
  $("receiptLogo").style.display="none";

  const url=$("logoUrl").value.trim();
  if(!removeLogo && url){
    $("receiptLogo").src=url;
    $("receiptLogo").style.display="block";
    $("defaultLogo").style.display="none";
  }

  // Stable visual barcode based on invoice number
  const code=String($("invoiceNumber").value||"3574");
  $("barcode").style.background = makeBarcode(code);
}

function makeBarcode(text){
  let seed=0;
  for(const c of text) seed=(seed*31+c.charCodeAt(0))%100000;
  const bars=[];
  for(let i=0;i<85;i++){
    seed=(seed*9301+49297)%233280;
    bars.push(seed%3===0 ? "2px" : seed%5===0 ? "3px" : "1px");
  }
  let pos=0, parts=[];
  for(let i=0;i<bars.length;i++){
    const w=bars[i];
    parts.push(`#111 ${pos}px ${pos+parseInt(w)}px`);
    pos+=parseInt(w)+1;
  }
  return `repeating-linear-gradient(90deg,#111 0 1px,#fff 1px 2px)`;
}

$("addItem").addEventListener("click",()=>{
  items.push({name:"New Item",price:0,qty:1});
  renderItemsEditor();updatePreview();
});

$("logoFile").addEventListener("change",e=>{
  const file=e.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    $("receiptLogo").src=ev.target.result;
    $("receiptLogo").style.display="block";
    $("defaultLogo").style.display="none";
  };
  reader.readAsDataURL(file);
});

$("logoUrl").addEventListener("input",updatePreview);

document.querySelectorAll("input,select,textarea").forEach(el=>{
  if(!el.closest("#items") && !el.closest("#taxes") && el.id!=="logoFile"){
    el.addEventListener("input",updatePreview);
    el.addEventListener("change",updatePreview);
  }
});

$("currencySearch").addEventListener("input",()=>{
  const q=$("currencySearch").value.toLowerCase();
  [...$("currency").options].forEach(o=>o.hidden=!o.text.toLowerCase().includes(q));
});

document.querySelectorAll(".template-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".template-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    $("receipt").className=`receipt template-${btn.dataset.template}`;
  });
});

$("expandPreview").addEventListener("click",()=>{
  const stage=$(".preview-stage");
  if(stage.requestFullscreen) stage.requestFullscreen();
});

$("downloadPdf").addEventListener("click",async()=>{
  const button=$("downloadPdf");
  button.textContent="Generating PDF...";
  button.disabled=true;
  try{
    const receipt=$("receipt");
    const canvas=await html2canvas(receipt,{scale:3,useCORS:true,backgroundColor:"#ffffff"});
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    const maxW=80;
    const ratio=canvas.height/canvas.width;
    const h=maxW*ratio;
    const x=(210-maxW)/2;
    const y=18;
    pdf.addImage(canvas.toDataURL("image/png"),"PNG",x,y,maxW,h);
    pdf.save(`restaurant-bill-${$("invoiceNumber").value||"invoice"}.pdf`);
  }catch(err){
    alert("PDF generate nahi ho paya. Please internet connection check karke dobara try kare.");
    console.error(err);
  }finally{
    button.textContent="Download PDF";
    button.disabled=false;
  }
  
});

renderItemsEditor();
renderTaxes();
updatePreview();
