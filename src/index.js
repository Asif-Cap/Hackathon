/// <reference types="@fastly/js-compute" />
const Mustache = require('mustache');
// import { Router } from "@fastly/expressly";

//const router = new Router();



// Example here: https://illegally-willing-bengal.edgecompute.app/
addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

const template = Buffer.from(fastly.includeBytes("./src/templates/fragment.mustache")).toString('utf-8');

async function handleRequest(event) {

  let url = new URL(event.request.url)
  let params = url.searchParams
  let amount = params.get("amount")


  const store = new ObjectStore('Fsmonthlyprice')
  const dataReq = await fetch(`https://uat.ikea.finance.bank.ikano/api/v1/loanmatrix`, {
    backend: "main_origin",
    cacheOverride: new CacheOverride("override", { ttl: 60 }), // Cache for 60 seconds
  });
  // Read the body as a JS object (this API returns JSON)
  const data = await dataReq.json();
 
  await store.put('hello1', JSON.stringify(data));
  const loandata = await store.get('hello1');
  const dataContent = await loandata.json();

  let finaldata;

  if(amount >= 99 && amount <= 15000){
    finaldata = calculate(amount ,dataContent);
  }else {
    
  }
  

let html = Mustache.render(
  template,
  {
    data: finaldata
  }
)

  if(finaldata) {
    return new Response(JSON.stringify(finaldata), {
      headers: { "content-type": "application/json" },
      status: 200,
    })
  } 
  // If we get here, the object was not found.
  return new Response("Amount not in Range", {
    headers: { "content-type": "applicaiton/json" },
    status: 404,
  })
}


const calculate = (amount, data) => {
  const result = data?.ranges?.filter(val => 
    amount >= val.from && amount <= val.to
  );


  let duration = result[0].targetTerm;

  let monthlyPayment = amount / duration;

  if(monthlyPayment != Math.round((monthlyPayment*100)/100)) {

      monthlyPayment = Math.ceil(monthlyPayment)

  }

  let finalPayment = amount - (monthlyPayment*Number(duration-1))

  finalPayment = Math.round(finalPayment*100)/100;

  let totalLoanAmount = (monthlyPayment*Number(duration-1)) + finalPayment;
  
  return {monthlyPayment ,finalPayment,totalLoanAmount,duration , ...data }
}