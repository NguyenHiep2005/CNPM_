
document.querySelectorAll('.button-sub-name').forEach(btn => {
  btn.addEventListener('click', function(e){
    e.preventDefault();
    window.location.href = 'product.html';
  });
});


document.querySelectorAll('.product-card 1').forEach(card => {
  card.style.cursor = 'pointer';
  card.addEventListener('click', () => {
    window.location.href = 'products.html';
  });
});
