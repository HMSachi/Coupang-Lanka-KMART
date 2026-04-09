export function formatCurrency(num){
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(num)
}
