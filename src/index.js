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
  console.log(data)
  let one_time_loans={}
  let terms=result[0].terms
  for (let i=0; i<terms.length; i++){

    
  let responseData={}
  
   responseData.duration = terms[i];
   responseData.target_duration=false
  if(result[0].targetTerm == responseData.duration){
    responseData.target_duration=true
  }
  responseData.monthly_payment = amount / responseData.duration;

  if(responseData.monthly_payment != Math.round((responseData.monthly_payment*100)/100)) {

    responseData.monthly_payment = Math.ceil(responseData.monthly_payment)

  }

  responseData.final_payment = amount - (responseData.monthly_payment*Number(responseData.duration-1))

  responseData.final_payment = Math.round(responseData.final_payment*100)/100;

  responseData.total_loan_amount = (responseData.monthly_payment*Number(responseData.duration-1)) + responseData.final_payment;
  responseData.total_amount=amount
  responseData.apr=data.apr
  responseData.rate=data.rate
  one_time_loans[responseData.duration]=responseData
  
 
}
 
 return {one_time_loans}
}